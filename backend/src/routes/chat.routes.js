// ============================================================
// chat.routes.js — Chat Q&A API (Query Router)
// ============================================================
// Endpoints (all under /api/sessions/:id/chat):
//   POST   /             — receive question, route to rule-based OR AI engine
//   GET    /history      — return past Q&A exchanges for this session
//   DELETE /history      — clear Q&A history for this session
// ============================================================
import { Router } from 'express';

import { query } from '../config/db.js';
import { authenticate, requireOwnership } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { handleQuestion } from '../services/query-router.service.js';
import bcrypt from 'bcryptjs';

const SENSITIVE_PATTERN = /\b(credit card|cc|bank|account|phone number|otp|password|passcode|cvv|pin)\b/i;

const router = Router();
router.use(authenticate);

// ── Helper: verify session + ownership ────────────────────────
async function getReadySession(sessionId, userId, next) {
  const result = await query(
    'SELECT id, user_id, name, parse_status FROM sessions WHERE id = $1',
    [sessionId]
  );
  if (result.rows.length === 0) {
    next(createError('Session not found.', 404, 'SESSION_NOT_FOUND'));
    return null;
  }
  const session = result.rows[0];
  if (session.user_id !== userId) {
    next(createError('Access denied.', 403, 'FORBIDDEN'));
    return null;
  }
  if (session.parse_status !== 'completed') {
    next(createError(
      `Chat not available — session is "${session.parse_status}".`,
      422,
      'SESSION_NOT_READY'
    ));
    return null;
  }
  return session;
}

// ── POST /api/sessions/:id/chat ────────────────────────────────
router.post('/:id/chat', async (req, res, next) => {
  try {
    const session = await getReadySession(req.params.id, req.user.id, next);
    if (!session) return;

    const { question, password } = req.body;
    if (!question?.trim()) {
      return next(createError('Please enter a question.', 400, 'MISSING_QUESTION'));
    }
    if (question.trim().length > 500) {
      return next(createError('Question is too long. Maximum 500 characters.', 400, 'QUESTION_TOO_LONG'));
    }

    // ── Sensitive Information Guardrail (DLP) ─────────────────
    if (SENSITIVE_PATTERN.test(question.trim())) {
      if (!password) {
        return res.status(403).json({
          success: false,
          requiresPassword: true,
          error: 'Sensitive query detected. Please enter your password to continue.'
        });
      }
      // Verify password
      const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      if (userRes.rows.length === 0) {
        return next(createError('User not found.', 404, 'USER_NOT_FOUND'));
      }
      const isValid = await bcrypt.compare(password, userRes.rows[0].password_hash);
      if (!isValid) {
        return res.status(403).json({ success: false, error: 'Incorrect password.' });
      }
    }
    // ──────────────────────────────────────────────────────────

    // Fetch user preferences for AI
    const userRes = await query('SELECT preferred_model FROM users WHERE id = $1', [req.user.id]);
    const preferredModel = userRes.rows[0]?.preferred_model;

    // Fetch analytics data from cache for rule-based engine
    const cacheRes = await query(
      'SELECT cache_key, data FROM analytics_cache WHERE session_id = $1',
      [req.params.id]
    );
    const analyticsData = {};
    for (const row of cacheRes.rows) {
      if (row.cache_key === 'overview') analyticsData.overview = row.data;
      if (row.cache_key === 'participants') analyticsData.participants = row.data;
      if (row.cache_key === 'peak_hours') analyticsData.peak_hours = row.data;
      if (row.cache_key === 'media_links') analyticsData.media_counts = row.data;
      if (row.cache_key.startsWith('word_freq_')) analyticsData.top_words = row.data;
    }

    // ── Dynamic Context Retrieval (RAG via PostgreSQL FTS) ──
    let messages = [];
    const searchHitsRes = await query(
      `SELECT id
       FROM messages
       WHERE session_id = $1
         AND to_tsvector('english', message_text) @@ websearch_to_tsquery('english', $2)
       ORDER BY id DESC
       LIMIT 2`,
      [req.params.id, question.trim()]
    );

    if (searchHitsRes.rows.length > 0) {
      // Build a window query for each hit (+/- 125 messages per hit)
      const hitIds = searchHitsRes.rows.map(r => r.id);
      
      const conditions = hitIds.map((_, index) => `id BETWEEN $${(index * 2) + 2} AND $${(index * 2) + 3}`).join(' OR ');
      const params = [req.params.id];
      hitIds.forEach(id => {
        params.push(Number(id) - 125); // Lower bound
        params.push(Number(id) + 125); // Upper bound
      });

      const windowRes = await query(
        `SELECT sender_name, message_text, sent_at, message_type
         FROM messages
         WHERE session_id = $1 AND (${conditions})
         ORDER BY id ASC`,
        params
      );
      messages = windowRes.rows;
    } else {
      // Fallback: Fetch recent messages for AI context
      const messagesRes = await query(
        `SELECT sender_name, message_text, sent_at, message_type
         FROM messages
         WHERE session_id = $1
         ORDER BY sent_at DESC
         LIMIT 500`,
        [req.params.id]
      );
      messages = messagesRes.rows.reverse();
    }

    // Route question to correct engine and get answer
    const result = await handleQuestion({
      question: question.trim(),
      sessionId: req.params.id,
      userId: req.user.id,
      preferredModel,
      analyticsData,
      messages,
      sessionName: session.name,
    });
    
    // Fallback if rule engine doesn't know the answer
    let finalAnswer = result.answer;
    if (!finalAnswer) {
      finalAnswer = "I'm sorry, I don't know the answer to that from the pre-computed analytics. Try rephrasing your question.";
    }

    // Persist Q&A to chat_history
    await query(
      `INSERT INTO chat_history (session_id, user_id, question, answer, engine_used, ai_model_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.params.id, req.user.id, question.trim(), finalAnswer, result.engine || 'rule_based', result.modelUsed || null]
    );

    const response = {
      success: true,
      question: question.trim(),
      answer: finalAnswer,
      engine: result.engine || 'rule_based',
      modelUsed: result.modelUsed,
    };

    if (result.disclaimer) {
      response.disclaimer = result.disclaimer;
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/chat/history ────────────────────────
/**
 * Return all past Q&A exchanges for a session.
 * Returns: { success, history: [{ id, question, answer, engine_used, created_at }] }
 */
router.get('/:id/chat/history', async (req, res, next) => {
  try {
    const session = await getReadySession(req.params.id, req.user.id, next);
    if (!session) return;

    const result = await query(
      `SELECT id, question, answer, engine_used, ai_model_used as "modelUsed", created_at
       FROM chat_history
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [req.params.id]
    );

    res.json({ success: true, history: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/sessions/:id/chat/history ─────────────────────
/**
 * Clear all Q&A history for a session.
 * Returns: { success, message, deleted_count }
 */
router.delete('/:id/chat/history', async (req, res, next) => {
  try {
    // Need ownership check — fetch session manually
    const sessionResult = await query(
      'SELECT id, user_id FROM sessions WHERE id = $1',
      [req.params.id]
    );
    if (sessionResult.rows.length === 0) {
      return next(createError('Session not found.', 404, 'SESSION_NOT_FOUND'));
    }
    if (!requireOwnership(sessionResult.rows[0].user_id, req.user.id, res)) return;

    const result = await query(
      'DELETE FROM chat_history WHERE session_id = $1',
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Chat history cleared.',
      deleted_count: result.rowCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
