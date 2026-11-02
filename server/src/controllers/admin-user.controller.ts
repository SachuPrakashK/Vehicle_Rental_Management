import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { safeUser } from '../models/user.model.js';
import * as users from '../repositories/user.repository.js';
import * as sessions from '../repositories/session.repository.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
import * as rbac from '../repositories/rbac.repository.js';
const duplicate = (error: unknown): never => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
    throw new AppError(409, 'An account with this email already exists.');
  throw error;
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
  try {
    const input = request.body;
    const user = await users.createUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
    });
    await rbac.assignSystemRole(user.id, input.role, request.user!.id);
    await rbac.audit({
      actorId: request.user!.id,
      targetUserId: user.id,
      action: 'USER_CREATED',
      after: { role: input.role, isActive: true },
    });
    success(response, 201, 'User created successfully.', safeUser(user));
  } catch (error) {
    duplicate(error);
  }
}
export async function update(request: Request, response: Response) {
  try {
    const id = String(request.params['id']);
    const existing = await users.findUserById(id);
    if (!existing) throw new AppError(404, 'User not found.');
    if (id === request.user!.id && request.body.role !== request.user!.role)
      throw new AppError(403, 'You cannot change your own role.');
    if (
      existing.role === 'SUPER_ADMIN' &&
      (!request.body.isActive || request.body.role !== 'SUPER_ADMIN')
    ) {
      const count = await pool.query<{ count: string }>(
        "SELECT count(*) FROM users WHERE role='SUPER_ADMIN' AND is_active=true",
      );
      if (Number(count.rows[0]!.count) <= 1)
        throw new AppError(400, 'The last active super administrator cannot be deactivated.');
    }
    const updated = await users.updateAdminUser(id, request.body);
    if (!updated) throw new AppError(404, 'User not found.');
    if (!updated.is_active) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await sessions.revokeUserSessions(client, updated.id);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    if (existing.role !== request.body.role) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const role = await client.query<{ id: string }>(
          'SELECT id FROM roles WHERE code=$1 AND is_active=true',
          [request.body.role],
        );
        if (!role.rows[0]) throw new AppError(400, 'Selected role is unavailable.');
        await rbac.replaceUserRoles(client, updated.id, [role.rows[0].id], request.user!.id);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    await rbac.audit({
      actorId: request.user!.id,
      targetUserId: updated.id,
      action: 'USER_UPDATED',
      after: { role: updated.role, isActive: updated.is_active },
    });
    success(response, 200, 'User updated successfully.', safeUser(updated));
  } catch (error) {
    duplicate(error);
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
