import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/auth.controller.js';
import * as imageController from '../controllers/profile-image.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter, passwordLimiter } from '../middleware/rate-limit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetTokenSchema,
} from '../validators/auth.validators.js';
import { profileSchema } from '../validators/user.validators.js';
import { asyncHandler } from '../utils/async-handler.js';
import { env } from '../config/env.js';
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.IMAGE_UPLOAD_MAX_MB * 1024 * 1024, files: 1, fields: 0 },
});
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(controller.register),
);
router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(controller.login));
router.post('/refresh-token', authLimiter, asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));
router.post(
  '/forgot-password',
  passwordLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(controller.forgotPassword),
);
router.post(
  '/verify-reset-token',
  passwordLimiter,
  validateBody(resetTokenSchema),
  asyncHandler(controller.verifyReset),
);
router.post(
  '/reset-password',
  passwordLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(controller.resetPassword),
);
router.post(
  '/change-password',
  passwordLimiter,
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(controller.changePassword),
);
router.get('/me', requireAuth, asyncHandler(controller.me));
router.put('/me', requireAuth, validateBody(profileSchema), asyncHandler(controller.updateMe));
router.post(
  '/me/profile-image',
  requireAuth,
  upload.single('image'),
  asyncHandler(imageController.upload),
);
router.delete('/me/profile-image', requireAuth, asyncHandler(imageController.remove));
export default router;
