// ============================================================
// user.routes.js — User Account Management
// ============================================================
// Endpoints:
//   PUT    /api/users/password   — change password
//   PUT    /api/users/settings   — update preferred AI model
//   DELETE /api/users/me         — delete account + all data
// ============================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { createError } from '../middleware/error.middleware.js';
import { deleteFromS3 } from '../services/s3.service.js';

const router = Router();
router.use(authenticate);

// ── PUT /api/users/password ────────────────────────────────────
/**
 * Change the current user's password.
 * Body: { currentPassword, newPassword }
 * Returns: { success, message }
 */
router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(createError('Current password and new password are required.', 400, 'MISSING_FIELDS'));
    }
    if (newPassword.length < 8) {
      return next(createError('New password must be at least 8 characters.', 400, 'WEAK_PASSWORD'));
    }
    if (currentPassword === newPassword) {
      return next(createError('New password must be different from the current password.', 400, 'SAME_PASSWORD'));
    }

    // Fetch current hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return next(createError('User not found.', 404, 'USER_NOT_FOUND'));
    }

    const isCorrect = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isCorrect) {
      return next(createError('Current password is incorrect.', 401, 'WRONG_PASSWORD'));
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/users/settings ────────────────────────────────────
/**
 * Update user preferences.
 * Body: { preferred_model: string }
 * Allowed models: gemini/gemini-flash, openai/gpt-4o, anthropic/claude-3-haiku, google/gemma-4-31b-it:free, openai/gpt-oss-20b:free, nvidia/nemotron-3-nano-30b-a3b:free
 * Returns: { success, settings }
 */
router.put('/settings', async (req, res, next) => {
  try {
    const { preferred_model } = req.body;

    const allowedModels = [
      'gemini/gemini-flash',
      'openai/gpt-4o',
      'anthropic/claude-3-haiku',
      'google/gemma-4-31b-it:free',
      'minimax/minimax-m3:free',
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
    ];

    if (!preferred_model) {
      return next(createError('preferred_model is required.', 400, 'MISSING_FIELDS'));
    }
    if (!allowedModels.includes(preferred_model)) {
      return next(createError(
        `Invalid model. Allowed: ${allowedModels.join(', ')}`,
        400,
        'INVALID_MODEL'
      ));
    }

    const result = await query(
      `UPDATE users
       SET preferred_model = $1
       WHERE id = $2
       RETURNING id, email, name, preferred_model`,
      [preferred_model, req.user.id]
    );

    res.json({ success: true, settings: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/users/me ───────────────────────────────────────
/**
 * Delete the current user's account.
 * This permanently removes:
 *   - All sessions (and their messages, analytics, chat history via CASCADE)
 *   - All S3 files for all sessions
 *   - The user row itself
 *
 * Body: { confirmPassword } — user must confirm their password to proceed
 * Returns: { success, message }
 *
 * NOTE: After this, the client-side JWT is already invalid since the user
 * no longer exists. Tell the client to clear localStorage.
 */
router.delete('/me', async (req, res, next) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return next(createError(
        'Please confirm your password to delete your account.',
        400,
        'MISSING_CONFIRM_PASSWORD'
      ));
    }

    // Verify password before doing anything destructive
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return next(createError('User not found.', 404, 'USER_NOT_FOUND'));
    }

    const isCorrect = await bcrypt.compare(confirmPassword, userResult.rows[0].password_hash);
    if (!isCorrect) {
      return next(createError('Password is incorrect. Account not deleted.', 401, 'WRONG_PASSWORD'));
    }

    // Fetch all S3 keys for this user's sessions
    const s3Result = await query(
      'SELECT s3_file_key FROM sessions WHERE user_id = $1 AND s3_file_key IS NOT NULL',
      [req.user.id]
    );

    // Delete all S3 files (best-effort — don't fail if S3 is down)
    const s3Deletions = s3Result.rows.map((row) =>
      deleteFromS3(row.s3_file_key).catch((err) => {
        console.error(`⚠️  S3 delete failed for key ${row.s3_file_key}:`, err.message);
      })
    );
    await Promise.all(s3Deletions);

    // Delete user (sessions + everything cascade from FK ON DELETE CASCADE)
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
