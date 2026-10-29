import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import * as imageController from '../controllers/vehicle-image.controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.IMAGE_UPLOAD_MAX_MB * 1024 * 1024, files: 1, fields: 0 },
});

router.post('/images', requireAuth, upload.single('image'), asyncHandler(imageController.upload));

export default router;
