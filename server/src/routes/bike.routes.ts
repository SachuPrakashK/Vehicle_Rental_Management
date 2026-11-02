import { Router } from 'express';
import * as controller from '../controllers/bike.controller.js';
import { requireAuth, requirePermission } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { bikeSchema } from '../validators/bike.validators.js';

const router = Router();
router.use(requireAuth);
router.get('/', requirePermission('vehicles.view'), asyncHandler(controller.list));
router.get('/:id', requirePermission('vehicles.view'), asyncHandler(controller.get));
router.post(
  '/',
  requirePermission('vehicles.create'),
  validateBody(bikeSchema),
  asyncHandler(controller.create),
);
router.put(
  '/:id',
  requirePermission('vehicles.edit'),
  validateBody(bikeSchema),
  asyncHandler(controller.update),
);
router.delete('/:id', requirePermission('vehicles.delete'), asyncHandler(controller.remove));
export default router;
