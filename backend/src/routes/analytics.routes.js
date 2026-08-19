// ============================================================
// analytics.routes.js — Rule-Based Analytics Engine
// ============================================================
// All endpoints compute stats using SQL queries on the messages table.
// Results are cached in analytics_cache (compute once, serve forever).
//
// Endpoints (all under /api/sessions/:id/analytics):
//   GET /overview          — totals, date range, participant count
//   GET /participants      — per-person message breakdown
//   GET /timeline          — messages per day/week/month
//   GET /peak-hours        — hourly activity (0–23)
//   GET /word-frequency    — top N words (stop-words filtered)
//   GET /emoji-frequency   — most used emojis
//   GET /media-links       — media count, link count, longest message
//   GET /response-time     — average response time per sender
// ============================================================
import { Router } from 'express';

import { query } from '../config/db.js';
import { authenticate, requireOwnership } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authenticate);

// ── Helper: verify session exists and belongs to user ──────────
async function getSession(sessionId, userId, next) {
  const result = await query(
    'SELECT id, user_id, parse_status FROM sessions WHERE id = $1',
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
      `Analytics not available — session is "${session.parse_status}".`,
      422,
      'SESSION_NOT_READY'
    ));
    return null;
  }
  return session;
}

// ── Helper: get or set analytics cache ─────────────────────────
async function getCached(sessionId, cacheKey) {
  const result = await query(
    'SELECT data FROM analytics_cache WHERE session_id = $1 AND cache_key = $2',
    [sessionId, cacheKey]
  );
  return result.rows[0]?.data ?? null;
}

async function setCache(sessionId, cacheKey, data) {
  await query(
    `INSERT INTO analytics_cache (session_id, cache_key, data)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, cache_key)
     DO UPDATE SET data = $3, computed_at = NOW()`,
    [sessionId, cacheKey, JSON.stringify(data)]
  );
}

// ── GET /api/sessions/:id/analytics/overview ───────────────────
router.get('/:id/analytics/overview', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const cacheKey = 'overview';
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const result = await query(
      `SELECT
         COUNT(*)::int                                        AS total_messages,
         COUNT(DISTINCT sender_name)::int                     AS participant_count,
         MIN(sent_at)                                    AS first_message_at,
         MAX(sent_at)                                    AS last_message_at,
         EXTRACT(DAY FROM MAX(sent_at) - MIN(sent_at))  AS duration_days,
         COUNT(*) FILTER (WHERE message_type = 'media')::int AS media_count,
         COUNT(*) FILTER (WHERE message_type = 'link')::int  AS link_count
       FROM messages WHERE session_id = $1`,
      [req.params.id]
    );

    const data = result.rows[0];
    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/participants ───────────────
router.get('/:id/analytics/participants', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const cacheKey = 'participants';
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const result = await query(
      `SELECT
         sender_name,
         COUNT(*)::int                                        AS message_count,
         ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS percentage,
         AVG(LENGTH(message_text))::int                       AS avg_message_length,
         COUNT(*) FILTER (WHERE message_type = 'media')::int AS media_count
       FROM messages
       WHERE session_id = $1
       GROUP BY sender_name
       ORDER BY message_count DESC`,
      [req.params.id]
    );

    const data = result.rows;
    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/timeline ──────────────────
// Query param: ?granularity=day|week|month  (default: day)
router.get('/:id/analytics/timeline', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const granularity = ['day', 'week', 'month'].includes(req.query.granularity)
      ? req.query.granularity
      : 'day';

    const cacheKey = `timeline_${granularity}`;
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, granularity, cached: true });

    const result = await query(
      `SELECT
         DATE_TRUNC($1, sent_at) AS period,
         COUNT(*)::int                AS message_count
       FROM messages
       WHERE session_id = $2
       GROUP BY period
       ORDER BY period ASC`,
      [granularity, req.params.id]
    );

    const data = result.rows;
    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, granularity, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/peak-hours ────────────────
router.get('/:id/analytics/peak-hours', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const cacheKey = 'peak_hours';
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const result = await query(
      `SELECT
         EXTRACT(HOUR FROM sent_at) AS hour,
         COUNT(*)::int                   AS message_count
       FROM messages
       WHERE session_id = $1
       GROUP BY hour
       ORDER BY hour ASC`,
      [req.params.id]
    );

    // Fill in zero-count hours so chart always has 0–23
    const hourMap = {};
    result.rows.forEach((r) => { hourMap[parseInt(r.hour)] = parseInt(r.message_count); });
    const data = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      message_count: hourMap[h] ?? 0,
    }));

    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/word-frequency ────────────
// Query param: ?limit=20  (default 20, max 100)
router.get('/:id/analytics/word-frequency', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const cacheKey = `word_freq_${limit}`;
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    // Stop words — common English words that aren't meaningful in a chat
    const stopWords = [
      'the','is','a','an','and','or','but','in','on','at','to','for',
      'of','with','by','from','up','about','into','through','this','that',
      'it','its','be','was','are','were','has','have','had','do','did',
      'will','would','could','should','may','might','i','you','he','she',
      'we','they','me','him','her','us','them','my','your','his','our',
      'their','what','which','who','whom','how','when','where','why','not',
      'no','so','if','as','than','then','just','also','very','too','can',
      'get','got','go','going','im','ok','okay','yeah','yes','oh','hi',
      'hey','lol','lmao','omg','null','media','omitted','message','deleted',
    ];

    const result = await query(
      `SELECT
         word,
         COUNT(*)::int AS frequency
       FROM (
         SELECT regexp_split_to_table(
           lower(regexp_replace(message_text, '[^a-zA-Z ]', ' ', 'g')),
           '\\s+'
         ) AS word
         FROM messages
         WHERE session_id = $1
           AND message_type = 'text'
       ) AS words
       WHERE
         length(word) > 2
         AND word != ''
         AND word != ANY($2::text[])
       GROUP BY word
       ORDER BY frequency DESC
       LIMIT $3`,
      [req.params.id, stopWords, limit]
    );

    const data = result.rows;
    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/emoji-frequency ───────────
router.get('/:id/analytics/emoji-frequency', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const cacheKey = 'emoji_freq';
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    // Extract emojis using Unicode range regex in PostgreSQL
    const result = await query(
      `SELECT
         emoji,
         COUNT(*)::int AS frequency
       FROM (
         SELECT regexp_matches(
           message_text,
           '[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}]',
           'g'
         ) AS m
         FROM messages
         WHERE session_id = $1
       ) AS extracted,
       LATERAL (SELECT m[1] AS emoji) AS e
       GROUP BY emoji
       ORDER BY frequency DESC
       LIMIT 30`,
      [req.params.id]
    );

    const data = result.rows;
    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/media-links ───────────────
router.get('/:id/analytics/media-links', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const cacheKey = 'media_links';
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE message_type = 'media')::int    AS media_count,
         COUNT(*) FILTER (WHERE message_type = 'link')::int     AS link_count,
         COUNT(*) FILTER (WHERE message_type = 'deleted')::int  AS deleted_count,
         MAX(LENGTH(message_text)) FILTER (WHERE message_type = 'text')::int AS longest_message_chars,
         AVG(LENGTH(message_text)) FILTER (WHERE message_type = 'text')::int AS avg_message_chars
       FROM messages WHERE session_id = $1`,
      [req.params.id]
    );

    // Also get the actual longest message text
    const longestMsg = await query(
      `SELECT sender_name, message_text, sent_at
       FROM messages
       WHERE session_id = $1 AND message_type = 'text'
       ORDER BY LENGTH(message_text) DESC
       LIMIT 1`,
      [req.params.id]
    );

    const data = {
      ...result.rows[0],
      longest_message: longestMsg.rows[0] ?? null,
    };

    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id/analytics/response-time ─────────────
router.get('/:id/analytics/response-time', async (req, res, next) => {
  try {
    const session = await getSession(req.params.id, req.user.id, next);
    if (!session) return;

    const cacheKey = 'response_time';
    const cached = await getCached(req.params.id, cacheKey);
    if (cached) return res.json({ success: true, data: cached, cached: true });

    // Calculate response time = gap between consecutive messages from different senders
    // Capped at 3 hours to exclude overnight gaps that aren't real "responses"
    const result = await query(
      `WITH ordered AS (
         SELECT
           sender_name,
           sent_at,
           LAG(sender_name) OVER (ORDER BY sent_at) AS prev_sender,
           LAG(sent_at)     OVER (ORDER BY sent_at) AS prev_sent_at
         FROM messages
         WHERE session_id = $1
       )
       SELECT
         sender_name,
         ROUND(AVG(
           EXTRACT(EPOCH FROM (sent_at - prev_sent_at)) / 60
         ))::int AS avg_response_minutes
       FROM ordered
       WHERE
         sender_name != prev_sender                           -- it's a reply
         AND sent_at - prev_sent_at < INTERVAL '3 hours'     -- exclude long gaps
       GROUP BY sender_name
       ORDER BY avg_response_minutes ASC`,
      [req.params.id]
    );

    const data = result.rows;
    await setCache(req.params.id, cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (err) {
    next(err);
  }
});

export default router;
