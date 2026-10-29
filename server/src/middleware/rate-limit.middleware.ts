import { rateLimit } from 'express-rate-limit';
const response = {
  success: false,
  message: 'Too many attempts. Please try again later.',
  errors: [],
};
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: response,
});
export const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: response,
});
