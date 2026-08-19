// ============================================================
// session.routes.js — Chat Session Management
// ============================================================
// Endpoints:
//   POST   /api/sessions           — upload .txt file, create session
//   GET    /api/sessions           — list all sessions for current user
//   GET    /api/sessions/:id       — get single session (with parse status)
//   DELETE /api/sessions/:id       — delete session (DB + S3 file)
// ============================================================
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

import { query, withTransaction } from '../config/db.js';
import { authenticate, requireOwnership } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { uploadToS3, deleteFromS3 } from '../services/s3.service.js';
import { parseWhatsAppFile } from '../services/parser.service.js';

const router = Router();

// ── Multer config — memory storage (file goes to S3, not disk) ─
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(createError('Only .txt files are accepted.', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

// All session routes require authentication
router.use(authenticate);

// ── POST /api/sessions ─────────────────────────────────────────
/**
 * Upload a WhatsApp .txt export, parse it, store in DB.
 * Multipart form: file field = "chatFile"
 * Returns: { success, session: { id, name, parse_status } }
 *
 * Flow:
 *   1. Validate file (multer handles size + type)
 *   2. Upload raw file to S3 (backup copy)
 *   3. Create session row with parse_status = 'parsing'
 *   4. Parse the .txt file line by line
 *   5. Bulk-insert all messages in a transaction
 *   6. Update session parse_status to 'completed' / 'failed' / 'empty'
 */
router.post('/', upload.single('chatFile'), async (req, res, next) => {
  if (!req.file) {
    return next(createError('No file uploaded. Please attach a .txt file.', 400, 'NO_FILE'));
  }

  const sessionId = uuidv4();
  const s3Key = `sessions/${req.user.id}/${sessionId}.txt`;
  const sessionName = req.body.name?.trim() || req.file.originalname.replace('.txt', '');
  const fileBuffer = req.file.buffer; // capture before req is gone

  try {
    // Step 1: Create session row immediately — status = 'parsing'
    // (S3 upload + parsing happen in background AFTER we respond)
    await query(
      `INSERT INTO sessions (id, user_id, name, s3_file_key, parse_status)
       VALUES ($1, $2, $3, $4, 'parsing')`,
      [sessionId, req.user.id, sessionName, s3Key]
    );

    // Respond immediately so UI can start polling
    res.status(202).json({
      success: true,
      message: 'File received. Parsing in progress...',
      session: { id: sessionId, name: sessionName, parse_status: 'parsing',
                 message_count: 0, participant_count: 0, created_at: new Date() },
    });

    // Step 2: Upload to S3 + parse (runs after response is sent)
    _uploadAndParse(sessionId, req.user.id, s3Key, fileBuffer).catch((err) => {
      console.error(`❌ Background processing failed for session ${sessionId}:`, err.message);
    });
  } catch (err) {
    next(err);
  }
});


/**
 * Internal: upload to S3 then parse + insert all messages in a transaction.
 * Updates session.parse_status when done.
 */
async function _uploadAndParse(sessionId, userId, s3Key, fileBuffer) {
  // S3 upload — non-blocking (failure is logged but doesn't stop parsing)
  uploadToS3(s3Key, fileBuffer, 'text/plain').catch(err => {
    console.warn(`⚠️  S3 upload failed for session ${sessionId}: ${err.message} (parsing continues)`);
  });

  return _parseAndInsert(sessionId, userId, s3Key, fileBuffer);
}

async function _parseAndInsert(sessionId, userId, s3Key, fileBuffer) {
  try {
    const { messages, skippedLines, participantNames } = parseWhatsAppFile(fileBuffer.toString('utf8'));
    console.log(`📝 Session ${sessionId}: parsed ${messages.length} messages, ${skippedLines} skipped lines`);

    if (messages.length === 0) {
      await query(
        `UPDATE sessions SET parse_status = 'empty', skipped_lines = $1, message_count = 0, participant_count = 0, parsed_at = NOW() WHERE id = $2`,
        [skippedLines, sessionId]
      );
      console.log(`⚠️  Session ${sessionId} is empty — no messages found.`);
      return;
    }

    // ── Bulk INSERT all messages in a single query ──────────────
    // Instead of N individual inserts (very slow over RDS), we build
    // one large VALUES list: INSERT INTO messages VALUES ($1,$2,...),($5,$6,...),...
    // This reduces 6000 round-trips to a single network call.
    const CHUNK_SIZE = 500; // Send in chunks to avoid hitting query size limits
    const chunks = [];
    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      chunks.push(messages.slice(i, i + CHUNK_SIZE));
    }

    await withTransaction(async (client) => {
      for (const chunk of chunks) {
        const values = [];
        const placeholders = chunk.map((msg, i) => {
          const base = i * 5;
          values.push(sessionId, msg.sender, msg.timestamp, msg.text, msg.type);
          return `($${base+1}, $${base+2}, $${base+3}, $${base+4}, $${base+5})`;
        });

        await client.query(
          `INSERT INTO messages (session_id, sender_name, sent_at, message_text, message_type)
           VALUES ${placeholders.join(', ')}`,
          values
        );
      }

      // Update session stats + mark completed
      await client.query(
        `UPDATE sessions
         SET parse_status     = 'completed',
             message_count    = $1,
             participant_count = $2,
             skipped_lines    = $3,
             first_message_at = $4,
             last_message_at  = $5,
             parsed_at        = NOW()
         WHERE id = $6`,
        [
          messages.length,
          participantNames.size,
          skippedLines,
          messages[0].timestamp,
          messages[messages.length - 1].timestamp,
          sessionId,
        ]
      );
    });

    console.log(`✅ Session ${sessionId} completed: ${messages.length} messages in ${chunks.length} chunk(s)`);
  } catch (err) {
    console.error(`❌ _parseAndInsert FAILED for session ${sessionId}:`, err.message);
    console.error(err.stack);
    // Clean up S3 file if parsing failed
    await deleteFromS3(s3Key).catch(e => console.error('Failed to delete S3 file on parse error:', e.message));
    // Mark session as failed so UI stops spinning
    await query(
      `UPDATE sessions SET parse_status = 'failed', parsed_at = NOW() WHERE id = $1`,
      [sessionId]
    ).catch(e => console.error('Also failed to mark session as failed:', e.message));
    throw err;
  }
}


// ── GET /api/sessions ──────────────────────────────────────────
/**
 * List all sessions belonging to the current user.
 * Returns: { success, sessions: [...] }
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, parse_status, message_count, participant_count,
              first_message_at, last_message_at, created_at
       FROM sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, sessions: result.rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/sessions/:id ──────────────────────────────────────
/**
 * Get a single session (includes parse_status for polling).
 * Returns: { success, session: {...} }
 */
router.get('/:id', async (req, res, next) => {
  try {
    // ⚠️ Must include user_id in SELECT for ownership check to work
    const result = await query(
      `SELECT id, user_id, name, parse_status, message_count, participant_count,
              skipped_lines, first_message_at, last_message_at, created_at
       FROM sessions WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return next(createError('Session not found.', 404, 'SESSION_NOT_FOUND'));
    }

    const session = result.rows[0];
    if (!requireOwnership(session.user_id, req.user.id, res)) return;

    // Don't expose user_id in response
    const { user_id, ...sessionData } = session;
    res.json({ success: true, session: sessionData });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/sessions/:id ───────────────────────────────────
/**
 * Delete a session: removes DB records AND the S3 file.
 * Returns: { success, message }
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, user_id, s3_file_key FROM sessions WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return next(createError('Session not found.', 404, 'SESSION_NOT_FOUND'));
    }

    const session = result.rows[0];
    if (!requireOwnership(session.user_id, req.user.id, res)) return;

    // Delete from S3 first, then DB (so we don't orphan S3 files)
    await deleteFromS3(session.s3_file_key);

    // Cascade delete: messages, analytics_cache, chat_history all cascade
    await query('DELETE FROM sessions WHERE id = $1', [req.params.id]);

    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
