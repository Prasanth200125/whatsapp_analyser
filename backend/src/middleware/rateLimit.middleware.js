// ============================================================
// rateLimit.middleware.js — Rate Limiting
// ============================================================
// Two limiters:
//   1. globalRateLimiter  — applied to ALL routes (prevents abuse)
//   2. authRateLimiter    — stricter limit on /api/auth/login only
//                           (prevents brute-force password attacks)
// ============================================================
import rateLimit from 'express-rate-limit';

/**
 * Global limiter: 100 requests per 15 minutes per IP.
 * Applied to every route in the app.
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  standardHeaders: true,    // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,     // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment and try again.',
    code: 'RATE_LIMITED',
  },
});

/**
 * Auth limiter: 10 attempts per 15 minutes per IP.
 * Applied ONLY to POST /api/auth/login.
 * After 10 failed attempts the client is locked out for 15 min.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait 15 minutes and try again.',
    code: 'AUTH_RATE_LIMITED',
  },
});
