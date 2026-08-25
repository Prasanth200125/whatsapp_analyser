// ============================================================
// auth.routes.js — Authentication Routes
// ============================================================
// Endpoints:
//   POST /api/auth/register  — create a new user account
//   POST /api/auth/login     — verify credentials, return JWT
//   GET  /api/auth/me        — return current user profile (protected)
//   POST /api/auth/logout    — client-side token removal (documented here)
// ============================================================
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { query } from '../config/db.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { createError } from '../middleware/error.middleware.js';

const router = Router();

// ── POST /api/auth/register ────────────────────────────────────
/**
 * Create a new user account.
 * Body: { email, password, name }
 * Returns: { success, message, user: { id, email, name } }
 */
router.post('/register', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // ── Input Validation ───────────────────────────────────────
    if (!email || !password || !name) {
      return next(createError('Email, password, and name are required.', 400, 'MISSING_FIELDS'));
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(createError('Please enter a valid email address.', 400, 'INVALID_EMAIL'));
    }
    if (password.length < 8) {
      return next(createError('Password must be at least 8 characters long.', 400, 'WEAK_PASSWORD'));
    }
    if (name.trim().length < 2) {
      return next(createError('Name must be at least 2 characters long.', 400, 'INVALID_NAME'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Check If Email Already Exists ──────────────────────────
    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return next(createError('An account with this email already exists.', 409, 'EMAIL_TAKEN'));
    }

    // ── Hash Password + Insert User ────────────────────────────
    // bcrypt cost factor 12 — strong enough, still fast on modern hardware
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [normalizedEmail, passwordHash, name.trim()]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ───────────────────────────────────────
/**
 * Verify credentials and return a signed JWT.
 * Body: { email, password }
 * Returns: { success, token, user: { id, email, name } }
 *
 * Rate limited: authRateLimiter (10 attempts per 15 min per IP)
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password are required.', 400, 'MISSING_FIELDS'));
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Find User ──────────────────────────────────────────────
    const result = await query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Always run bcrypt.compare — prevents timing attacks that reveal
    // whether an email exists or not (same response time either way)
    const user = result.rows[0];
    const dummyHash = '$2a$12$dummyhashfortimingnormalization.thisisnotreal';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.password_hash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !passwordMatch) {
      return next(createError('Incorrect email or password.', 401, 'INVALID_CREDENTIALS'));
    }

    // ── Sign JWT ───────────────────────────────────────────────
    // Expires in 7 days — user stays logged in for a week
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ── Update Last Login Timestamp ────────────────────────────
    await query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────
/**
 * Return the current authenticated user's profile.
 * Protected: requires valid JWT in Authorization header.
 * Returns: { success, user: { id, email, name, created_at, preferred_model } }
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, name, preferred_model, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return next(createError('User not found.', 404, 'USER_NOT_FOUND'));
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────
/**
 * Logout is handled CLIENT-SIDE by deleting the JWT from localStorage.
 * This endpoint exists as a clean API contract — it confirms logout
 * and can be extended later to handle server-side token blocklists.
 *
 * No auth check needed — even expired tokens should be able to "logout".
 */
router.post('/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully. Please delete your token on the client.',
  });
});

export default router;
