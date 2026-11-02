import { Router } from 'express';
import * as controller from '../controllers/admin-user.controller.js';
import { requireAuth, requirePermission, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../validators/user.validators.js';
import { asyncHandler } from '../utils/async-handler.js';
const router = Router();
router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN'));
router.get('/', requirePermission('users.view'), asyncHandler(controller.list));
router.post(
  '/',
  requirePermission('users.create'),
  validateBody(createUserSchema),
  asyncHandler(controller.create),
);
router.put(
  '/:id',
  requirePermission('users.edit'),
  validateBody(updateUserSchema),
  asyncHandler(controller.update),
);
router.delete('/:id', requirePermission('users.deactivate'), asyncHandler(controller.remove));
export default router;
