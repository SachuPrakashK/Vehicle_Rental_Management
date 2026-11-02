import { Router } from 'express';
import * as controller from '../controllers/upload.controller.js';
import { requireAuth, requirePermission } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post('/token', asyncHandler(controller.token));
router.post(
  '/finalize',
  requireAuth,
  requirePermission('vehicles.create'),
  asyncHandler(controller.finalize),
);

export default router;
