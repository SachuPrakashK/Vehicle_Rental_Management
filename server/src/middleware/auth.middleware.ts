import type { RequestHandler } from 'express';
import { pool } from '../config/database.js';
import type { UserRecord, UserRole } from '../models/user.model.js';
import { safeUser } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required.');
    const claims = verifyAccessToken(header.slice(7));
    const result = await pool.query<UserRecord>('SELECT * FROM users WHERE id = $1', [claims.sub]);
    const user = result.rows[0];
    if (!user?.is_active) throw new AppError(401, 'Authentication required.');
    request.user = safeUser(user);
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired access token.'));
  }
};
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (request, _response, next) => {
    if (!request.user) return next(new AppError(401, 'Authentication required.'));
    if (!roles.includes(request.user.role))
      return next(new AppError(403, 'You do not have permission to perform this action.'));
    next();
  };
