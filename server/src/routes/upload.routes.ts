import { Router } from 'express';
import * as controller from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

router.post('/token', asyncHandler(controller.token));
router.post('/finalize', requireAuth, asyncHandler(controller.finalize));

export default router;
