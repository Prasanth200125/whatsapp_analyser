// ============================================================
// error.middleware.js — Global Error Handler
// ============================================================

/**
 * 404 handler — catches requests to unknown routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

/**
 * Global error handler — catches all errors thrown in routes.
 * Never crashes the server. Always returns a clean JSON response.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Log full error server-side for debugging
  console.error(`❌ [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('   Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('   Stack:', err.stack);
  }

  // PostgreSQL constraint errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'A record with this value already exists.',
      code: 'DUPLICATE_ENTRY',
    });
  }

  // PostgreSQL connection error
  if (err.code === 'ECONNREFUSED' || err.code === '57P01') {
    return res.status(503).json({
      success: false,
      error: 'Database is temporarily unavailable. Please try again in a moment.',
      code: 'DB_UNAVAILABLE',
    });
  }

  // Multer file errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File is too large. Maximum size is 15MB.',
      code: 'FILE_TOO_LARGE',
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    error: isProduction && statusCode === 500
      ? 'An unexpected error occurred. Please try again.'
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
}

/**
 * Create a standard HTTP error with status code.
 */
export function createError(message, statusCode, code) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
