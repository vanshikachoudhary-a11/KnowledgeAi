import { findUserById } from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';
import { AppError } from './errorMiddleware.js';
export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7);
    if (!token) throw new AppError('AUTH_REQUIRED', 'Authentication is required.', 401);
    const payload = verifyToken(token);
    const user = await findUserById(payload.sub);
    if (!user) throw new AppError('INVALID_TOKEN', 'Your session is no longer valid.', 401);
    req.user = user; next();
  } catch (error) { next(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError' ? new AppError('INVALID_TOKEN', 'Your session is invalid or expired.', 401) : error); }
}
