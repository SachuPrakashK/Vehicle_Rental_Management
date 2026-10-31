import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import type { SafeUser, UserRecord } from '../models/user.model.js';
import { safeUser } from '../models/user.model.js';
import * as users from '../repositories/user.repository.js';
import * as sessions from '../repositories/session.repository.js';
import * as resets from '../repositories/reset.repository.js';
import { AppError } from '../utils/app-error.js';
import { hashToken, randomToken, signAccessToken } from '../utils/tokens.js';
import { emailService } from './email.service.js';

const refreshExpiry = (): Date => new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000);
const resetExpiry = (): Date => new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60000);
const invalidCredentials = (): AppError => new AppError(401, 'Invalid email or password.');
const dummyPasswordHash = bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);

async function issueSession(
  user: UserRecord,
): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
  const refreshToken = randomToken();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await sessions.createSession(
      client,
      user.id,
      crypto.randomUUID(),
      hashToken(refreshToken),
      refreshExpiry(),
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return { accessToken: signAccessToken(user.id, user.role), refreshToken, user: safeUser(user) };
}
export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<SafeUser> {
  try {
    return safeUser(
      await users.createUser({
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone || null,
        passwordHash: await bcrypt.hash(input.password, 12),
        role: 'STAFF',
      }),
    );
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
      throw new AppError(409, 'An account with this email already exists.');
    throw error;
  }
}
export async function login(email: string, password: string) {
  const user = await users.findUserByEmail(email);
  const passwordMatches = await bcrypt.compare(
    password,
    user?.password_hash ?? (await dummyPasswordHash),
  );
  if (!user || !passwordMatches) throw invalidCredentials();
  if (!user.is_active) throw new AppError(403, 'This account is inactive.');
  await users.updateLogin(user.id);
  return issueSession(user);
}
export async function refresh(rawToken: string) {
  if (!rawToken) throw new AppError(401, 'Invalid refresh session.');
  const client = await pool.connect();
  let completed = false;
  try {
    await client.query('BEGIN');
    const current = await sessions.findSessionForUpdate(client, hashToken(rawToken));
    if (!current) {
      throw new AppError(401, 'Invalid refresh session.');
    }
    if (current.revoked_at) {
      await sessions.revokeFamily(client, current.family_id);
      await client.query('COMMIT');
      completed = true;
      throw new AppError(401, 'Refresh session reuse detected.');
    }
    if (current.expires_at.getTime() <= Date.now()) {
      await sessions.revokeSession(client, current.token_hash);
      await client.query('COMMIT');
      completed = true;
      throw new AppError(401, 'Refresh session expired.');
    }
    const user = await users.findUserById(current.user_id, client);
    if (!user?.is_active) {
      await sessions.revokeFamily(client, current.family_id);
      await client.query('COMMIT');
      completed = true;
      throw new AppError(401, 'Invalid refresh session.');
    }
    const refreshToken = randomToken();
    const replacement = await sessions.createSession(
      client,
      user.id,
      current.family_id,
      hashToken(refreshToken),
      refreshExpiry(),
    );
    await sessions.replaceSession(client, current.id, replacement.id);
    await client.query('COMMIT');
    completed = true;
    return { accessToken: signAccessToken(user.id, user.role), refreshToken, user: safeUser(user) };
  } catch (error) {
    if (!completed) await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function logout(rawToken: string): Promise<void> {
  if (!rawToken) return;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await sessions.revokeSession(client, hashToken(rawToken));
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function forgotPassword(email: string): Promise<{ resetToken?: string }> {
  const user = await users.findUserByEmail(email);
  if (!user?.is_active) return {};
  const token = randomToken();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await resets.createReset(client, user.id, hashToken(token), resetExpiry());
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  await emailService.sendPasswordReset({ email: user.email, token });
  return env.NODE_ENV !== 'production' && env.EXPOSE_DEVELOPMENT_RESET_TOKEN
    ? { resetToken: token }
    : {};
}
async function validReset(client: import('pg').PoolClient, token: string) {
  const record = await resets.findResetForUpdate(client, hashToken(token));
  if (!record || record.used_at || record.expires_at.getTime() <= Date.now())
    throw new AppError(400, 'Reset token is invalid or expired.');
  return record;
}
export async function verifyResetToken(token: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await validReset(client, token);
    await client.query('ROLLBACK');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function resetPassword(token: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const record = await validReset(client, token);
    await users.updatePassword(record.user_id, hash, client);
    await resets.useReset(client, record.id);
    await sessions.revokeUserSessions(client, record.user_id);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await users.findUserById(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash)))
    throw new AppError(400, 'Current password is incorrect.');
  const hash = await bcrypt.hash(newPassword, 12);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await users.updatePassword(userId, hash, client);
    await sessions.revokeUserSessions(client, userId);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
