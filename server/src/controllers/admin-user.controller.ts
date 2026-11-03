import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { safeUser } from '../models/user.model.js';
import * as users from '../repositories/user.repository.js';
import * as sessions from '../repositories/session.repository.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
import * as rbac from '../repositories/rbac.repository.js';
import * as roleAssignments from '../services/role-assignment.service.js';
const duplicate = (error: unknown): never => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
    throw new AppError(409, 'An account with this email already exists.');
  throw error;
};
const requestedRoleIds = async (
  input: { roleIds?: string[]; role?: string },
  client: import('pg').PoolClient,
): Promise<string[] | undefined> => {
  if (input.roleIds) return input.roleIds;
  if (!input.role) return undefined;
  const role = (await rbac.assignableRoles(client)).find((item) => item.code === input.role);
  if (!role) throw new AppError(400, 'Selected role is unavailable.');
  return [role.id];
};
export async function list(_request: Request, response: Response) {
  const records = await users.listUsers();
  success(
    response,
    200,
    'Users loaded.',
    await Promise.all(
      records.map(async (user) => ({
        ...safeUser(user),
        roles: await rbac.userRoles(user.id),
        permissionCount: (await rbac.effectivePermissions(user.id)).length,
      })),
    ),
  );
}
export async function create(request: Request, response: Response) {
  const client = await pool.connect();
  try {
    const input = request.body;
    await client.query('BEGIN');
    const roleIds = await requestedRoleIds(input, client);
    const user = await users.createUser(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: 'STAFF',
      },
      client,
    );
    const authorization = await roleAssignments.replaceUserRoles(
      client,
      user.id,
      roleIds!,
      request.user!.id,
    );
    await rbac.audit(
      {
        actorId: request.user!.id,
        targetUserId: user.id,
        action: 'USER_CREATED',
        after: { roles: authorization.roles, isActive: true },
      },
      client,
    );
    await client.query('COMMIT');
    const created = await users.findUserById(user.id);
    success(response, 201, 'User created successfully.', {
      ...safeUser(created!),
      roles: authorization.roles,
      permissionCount: authorization.permissions.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    duplicate(error);
  } finally {
    client.release();
  }
}
export async function update(request: Request, response: Response) {
  const client = await pool.connect();
  try {
    const id = String(request.params['id']);
    await client.query('BEGIN');
    const existing = await users.findUserById(id, client);
    if (!existing) throw new AppError(404, 'User not found.');
    const roleIds = await requestedRoleIds(request.body, client);
    if (roleIds && !request.permissions?.includes('users.assign_role'))
      throw new AppError(403, 'You do not have permission to assign roles.');
    if (existing.role === 'SUPER_ADMIN' && !request.body.isActive) {
      const count = await pool.query<{ count: string }>(
        "SELECT count(*) FROM users WHERE role='SUPER_ADMIN' AND is_active=true",
      );
      if (Number(count.rows[0]!.count) <= 1)
        throw new AppError(400, 'The last active super administrator cannot be deactivated.');
    }
    const updated = await users.updateAdminUser(id, request.body, client);
    if (!updated) throw new AppError(404, 'User not found.');
    if (!updated.is_active) {
      await sessions.revokeUserSessions(client, updated.id);
    }
    const authorization = roleIds
      ? await roleAssignments.replaceUserRoles(client, updated.id, roleIds, request.user!.id)
      : {
          roles: await rbac.userRoles(updated.id, client),
          permissions: await rbac.effectivePermissions(updated.id, client),
        };
    await rbac.audit(
      {
        actorId: request.user!.id,
        targetUserId: updated.id,
        action: 'USER_UPDATED',
        after: { roles: authorization.roles, isActive: updated.is_active },
      },
      client,
    );
    await client.query('COMMIT');
    const saved = await users.findUserById(updated.id);
    success(response, 200, 'User updated successfully.', {
      ...safeUser(saved!),
      roles: authorization.roles,
      permissionCount: authorization.permissions.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    duplicate(error);
  } finally {
    client.release();
  }
}
export async function remove(request: Request, response: Response) {
  const id = String(request.params['id']);
  if (id === request.user!.id) throw new AppError(400, 'You cannot delete your own account.');
  const existing = await users.findUserById(id);
  if (!existing) throw new AppError(404, 'User not found.');
  if (existing.role === 'SUPER_ADMIN') {
    const count = await pool.query<{ count: string }>(
      "SELECT count(*) FROM users WHERE role='SUPER_ADMIN' AND is_active=true",
    );
    if (Number(count.rows[0]!.count) <= 1)
      throw new AppError(400, 'The last active super administrator cannot be deleted.');
  }
  await users.deleteUser(id);
  success(response, 200, 'User deleted successfully.');
}
