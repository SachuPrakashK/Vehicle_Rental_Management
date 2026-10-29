import type { SafeUser } from '../models/user.model.js';
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}
export {};
