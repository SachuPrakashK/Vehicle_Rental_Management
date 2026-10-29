import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';
import { pool } from '../config/database.js';
import { safeUser } from '../models/user.model.js';
import * as users from '../repositories/user.repository.js';
import * as sessions from '../repositories/session.repository.js';
import { AppError } from '../utils/app-error.js';
import { success } from '../utils/api-response.js';
const duplicate = (error: unknown): never => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
    throw new AppError(409, 'An account with this email already exists.');
  throw error;
};
export async function list(_request: Request, response: Response) {
  success(response, 200, 'Users loaded.', (await users.listUsers()).map(safeUser));
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
    success(response, 201, 'User created successfully.', safeUser(user));
  } catch (error) {
    duplicate(error);
  }
}
export async function update(request: Request, response: Response) {
  try {
    const updated = await users.updateAdminUser(String(request.params['id']), request.body);
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
