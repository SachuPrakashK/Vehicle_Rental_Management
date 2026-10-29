import type { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import type { UserRecord, UserRole } from '../models/user.model.js';
type Queryable = Pick<PoolClient, 'query'>;
const db = (client?: Queryable): Queryable => client ?? pool;
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role?: UserRole;
}
export async function findUserByEmail(
  email: string,
  client?: Queryable,
): Promise<UserRecord | undefined> {
  return (
    await db(client).query<UserRecord>('SELECT * FROM users WHERE lower(email)=lower($1)', [email])
  ).rows[0];
}
export async function findUserById(
  id: string,
  client?: Queryable,
): Promise<UserRecord | undefined> {
  return (await db(client).query<UserRecord>('SELECT * FROM users WHERE id=$1', [id])).rows[0];
}
export async function createUser(data: CreateUserData, client?: Queryable): Promise<UserRecord> {
  return (
    await db(client).query<UserRecord>(
      'INSERT INTO users(first_name,last_name,email,phone,password_hash,role) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        data.firstName,
        data.lastName,
        data.email,
        data.phone ?? null,
        data.passwordHash,
        data.role ?? 'ADMIN',
      ],
    )
  ).rows[0]!;
}
export async function updateLogin(id: string): Promise<void> {
  await pool.query('UPDATE users SET last_login_at=now(),updated_at=now() WHERE id=$1', [id]);
}
export async function updatePassword(id: string, hash: string, client?: Queryable): Promise<void> {
  await db(client).query('UPDATE users SET password_hash=$2,updated_at=now() WHERE id=$1', [
    id,
    hash,
  ]);
}
export async function updateProfile(
  id: string,
  firstName: string,
  lastName: string,
  phone: string | null,
): Promise<UserRecord> {
  return (
    await pool.query<UserRecord>(
      'UPDATE users SET first_name=$2,last_name=$3,phone=$4,updated_at=now() WHERE id=$1 RETURNING *',
      [id, firstName, lastName, phone],
    )
  ).rows[0]!;
}
export async function updateProfileImage(id: string, image: string | null): Promise<UserRecord> {
  return (
    await pool.query<UserRecord>(
      'UPDATE users SET profile_image=$2,updated_at=now() WHERE id=$1 RETURNING *',
      [id, image],
    )
  ).rows[0]!;
}
export async function listUsers(): Promise<UserRecord[]> {
  return (await pool.query<UserRecord>('SELECT * FROM users ORDER BY created_at DESC')).rows;
}
export async function updateAdminUser(
  id: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: UserRole;
    isActive: boolean;
  },
): Promise<UserRecord | undefined> {
  return (
    await pool.query<UserRecord>(
      'UPDATE users SET first_name=$2,last_name=$3,email=$4,phone=$5,role=$6,is_active=$7,updated_at=now() WHERE id=$1 RETURNING *',
      [id, data.firstName, data.lastName, data.email, data.phone, data.role, data.isActive],
    )
  ).rows[0];
}
export async function deleteUser(id: string): Promise<boolean> {
  return (await pool.query('DELETE FROM users WHERE id=$1', [id])).rowCount === 1;
}
