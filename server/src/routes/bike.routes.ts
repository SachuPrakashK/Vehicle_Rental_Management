import { Router } from 'express';
import * as controller from '../controllers/bike.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { bikeSchema } from '../validators/bike.validators.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', validateBody(bikeSchema), asyncHandler(controller.create));
router.put('/:id', validateBody(bikeSchema), asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
export default router;
