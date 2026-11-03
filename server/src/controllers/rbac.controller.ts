import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import * as rbac from '../repositories/rbac.repository.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
import * as roleAssignments from '../services/role-assignment.service.js';

const roleById = async (id: string) => (await rbac.listRoles()).find((role) => role.id === id);

export async function permissions(_request: Request, response: Response) {
  success(response, 200, 'Permissions loaded.', await rbac.listPermissions());
}

export async function roles(_request: Request, response: Response) {
  success(response, 200, 'Roles loaded.', await rbac.listRoles());
}

export async function role(request: Request, response: Response) {
  const record = await roleById(String(request.params['id']));
  if (!record) throw new AppError(404, 'Role not found.');
  success(response, 200, 'Role loaded.', record);
}

export async function createRole(request: Request, response: Response) {
  try {
    const id = await rbac.createRole(request.body);
    await rbac.audit({
      actorId: request.user!.id,
      targetRoleId: id,
      action: 'ROLE_CREATED',
      after: request.body,
    });
    success(response, 201, 'Role created successfully.', await roleById(id));
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505')
      throw new AppError(409, 'A role with this code already exists.');
    throw error;
  }
}

export async function updateRole(request: Request, response: Response) {
  const id = String(request.params['id']);
  const before = await roleById(id);
  if (!before) throw new AppError(404, 'Role not found.');
  if (before.isSystemRole) throw new AppError(403, 'System roles cannot be edited here.');
  if (!(await rbac.updateRole(id, request.body)))
    throw new AppError(
      409,
      'This role was changed by another administrator. Reload and try again.',
    );
  const after = await roleById(id);
  await rbac.audit({
    actorId: request.user!.id,
    targetRoleId: id,
    action: 'ROLE_UPDATED',
    before,
    after,
  });
  success(response, 200, 'Role updated successfully.', after);
}

export async function assignPermissions(request: Request, response: Response) {
  const id = String(request.params['id']);
  const before = await roleById(id);
  if (!before) throw new AppError(404, 'Role not found.');
  if (before.code === 'SUPER_ADMIN')
    throw new AppError(403, 'Super Admin permissions are protected.');
  if (before.version !== request.body.version)
    throw new AppError(
      409,
      'This role was changed by another administrator. Reload and try again.',
    );
  const valid = await rbac.listPermissions();
  const ids = new Set(valid.map((permission) => permission.id));
  if (request.body.permissionIds.some((permissionId: string) => !ids.has(permissionId)))
    throw new AppError(400, 'One or more permissions are invalid.');
  const selectedCodes = new Set(
    valid
      .filter((permission) => request.body.permissionIds.includes(permission.id))
      .map((permission) => permission.code),
  );
  const dependencies: Record<string, string> = {
    'vehicles.create': 'vehicles.view',
    'vehicles.edit': 'vehicles.view',
    'vehicles.delete': 'vehicles.view',
    'bookings.create': 'bookings.view',
    'bookings.edit': 'bookings.view',
    'bookings.cancel': 'bookings.view',
    'bookings.delete': 'bookings.view',
    'customers.create': 'customers.view',
    'customers.edit': 'customers.view',
    'customers.delete': 'customers.view',
    'ledger.create': 'ledger.view',
    'ledger.edit': 'ledger.view',
    'ledger.export': 'ledger.view',
    'reports.export': 'reports.view',
  };
  for (const [permission, dependency] of Object.entries(dependencies))
    if (selectedCodes.has(permission) && !selectedCodes.has(dependency))
      throw new AppError(400, `${permission} requires ${dependency}.`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await rbac.replacePermissions(client, id, request.body.permissionIds, request.body.version);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && error.message === 'ROLE_VERSION_CONFLICT')
      throw new AppError(
        409,
        'This role was changed by another administrator. Reload and try again.',
      );
    throw error;
  } finally {
    client.release();
  }
  const after = await roleById(id);
  await rbac.audit({
    actorId: request.user!.id,
    targetRoleId: id,
    action: 'ROLE_PERMISSIONS_UPDATED',
    before,
    after,
  });
  success(response, 200, 'Permissions updated successfully.', after);
}

export async function removeRole(request: Request, response: Response) {
  const id = String(request.params['id']);
  const before = await roleById(id);
  if (!before) throw new AppError(404, 'Role not found.');
  if (before.isSystemRole) throw new AppError(403, 'System roles cannot be deleted.');
  if (before.assignedUsers)
    throw new AppError(409, 'Remove this role from all users before deleting it.');
  await rbac.deleteRole(id);
  await rbac.audit({ actorId: request.user!.id, action: 'ROLE_DELETED', before });
  success(response, 200, 'Role deleted successfully.');
}

export async function userRoles(request: Request, response: Response) {
  success(response, 200, 'User roles loaded.', await rbac.userRoles(String(request.params['id'])));
}

export async function assignUserRoles(request: Request, response: Response) {
  const userId = String(request.params['id']);
  const client = await pool.connect();
  let result;
  try {
    await client.query('BEGIN');
    result = await roleAssignments.replaceUserRoles(
      client,
      userId,
      request.body.roleIds,
      request.user!.id,
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  success(response, 200, 'User roles updated successfully.', result);
}

export async function audits(_request: Request, response: Response) {
  success(response, 200, 'Authorization audit logs loaded.', await rbac.auditLogs());
}
