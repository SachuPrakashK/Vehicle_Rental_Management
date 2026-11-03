import type { PoolClient } from 'pg';
import type { RoleSummary } from '../models/rbac.model.js';
import type { UserRole } from '../models/user.model.js';
import * as rbac from '../repositories/rbac.repository.js';
import * as users from '../repositories/user.repository.js';
import { AppError } from '../utils/app-error.js';

interface AssignmentResult {
  roles: RoleSummary[];
  permissions: string[];
}

export async function replaceUserRoles(
  client: PoolClient,
  targetUserId: string,
  roleIds: string[],
  actorUserId: string,
): Promise<AssignmentResult> {
  if (targetUserId === actorUserId) throw new AppError(403, 'You cannot change your own roles.');
  const target = await users.findUserById(targetUserId, client);
  if (!target) throw new AppError(404, 'User not found.');
  if (target.role === 'SUPER_ADMIN')
    throw new AppError(403, 'Super Admin role assignments are protected.');

  const uniqueRoleIds = [...new Set(roleIds)];
  if (!uniqueRoleIds.length || uniqueRoleIds.length !== roleIds.length)
    throw new AppError(400, 'Select one or more unique roles.');

  const available = await rbac.assignableRoles(client);
  const selected = uniqueRoleIds.map((id) => available.find((role) => role.id === id));
  if (selected.some((role) => !role))
    throw new AppError(400, 'One or more roles are invalid or inactive.');
  const roles = selected as RoleSummary[];
  if (roles.some((role) => role.code === 'SUPER_ADMIN'))
    throw new AppError(403, 'Super Admin cannot be assigned through ordinary role assignment.');

  const before = await rbac.userRoles(targetUserId, client);
  await rbac.replaceUserRoles(client, targetUserId, uniqueRoleIds, actorUserId);
  const systemRole = roles.find((role) => role.code === 'ADMIN' || role.code === 'STAFF')?.code as
    UserRole | undefined;
  if (systemRole) await users.updateLegacyRole(targetUserId, systemRole, client);
  const permissions = await rbac.effectivePermissions(targetUserId, client);
  await rbac.audit(
    {
      actorId: actorUserId,
      targetUserId,
      action: 'USER_ROLES_UPDATED',
      before,
      after: { roles, permissions },
    },
    client,
  );
  return { roles, permissions };
}
