import { Router } from 'express';
import * as controller from '../controllers/rbac.controller.js';
import { requireAuth, requirePermission } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import {
  permissionAssignmentSchema,
  roleAssignmentSchema,
  roleSchema,
  updateRoleSchema,
} from '../validators/rbac.validators.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use(requireAuth);
router.get('/permissions', requirePermission('roles.view'), asyncHandler(controller.permissions));
router.get('/roles', requirePermission('roles.view'), asyncHandler(controller.roles));
router.get('/roles/:id', requirePermission('roles.view'), asyncHandler(controller.role));
router.post(
  '/roles',
  requirePermission('roles.create'),
  validateBody(roleSchema),
  asyncHandler(controller.createRole),
);
router.patch(
  '/roles/:id',
  requirePermission('roles.edit'),
  validateBody(updateRoleSchema),
  asyncHandler(controller.updateRole),
);
router.put(
  '/roles/:id/permissions',
  requirePermission('roles.assign_permissions'),
  validateBody(permissionAssignmentSchema),
  asyncHandler(controller.assignPermissions),
);
router.delete('/roles/:id', requirePermission('roles.delete'), asyncHandler(controller.removeRole));
router.get('/users/:id/roles', requirePermission('users.view'), asyncHandler(controller.userRoles));
router.put(
  '/users/:id/roles',
  requirePermission('users.assign_role'),
  validateBody(roleAssignmentSchema),
  asyncHandler(controller.assignUserRoles),
);
router.get(
  '/audit-logs',
  requirePermission('authorization.audit'),
  asyncHandler(controller.audits),
);
export default router;
