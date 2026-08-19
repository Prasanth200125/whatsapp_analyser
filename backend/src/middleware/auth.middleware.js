// ============================================================
// auth.middleware.js — JWT Verification
// ============================================================
import jwt from 'jsonwebtoken';

/**
 * Middleware: verify JWT from Authorization header.
 * Attaches decoded user to req.user on success.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.slice(7); // Remove "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Your session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.',
      code: 'TOKEN_INVALID',
    });
  }
}

/**
 * Helper: verify that the session belongs to the requesting user.
 * Call after authenticate middleware.
 */
export function requireOwnership(sessionUserId, requestingUserId, res) {
  if (sessionUserId !== requestingUserId) {
    res.status(403).json({
      success: false,
      error: 'Access denied. This session does not belong to you.',
      code: 'FORBIDDEN',
    });
    return false;
  }
  return true;
}
