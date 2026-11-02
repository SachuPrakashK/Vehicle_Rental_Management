import type { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import type { PermissionRecord, RoleRecord, RoleSummary } from '../models/rbac.model.js';

type Queryable = Pick<PoolClient, 'query'>;
const db = (client?: Queryable): Queryable => client ?? pool;

export async function effectivePermissions(userId: string, client?: Queryable): Promise<string[]> {
  const result = await db(client).query<{ code: string }>(
    `SELECT DISTINCT p.code
       FROM user_roles ur
       JOIN roles r ON r.id=ur.role_id AND r.is_active=true
       JOIN role_permissions rp ON rp.role_id=r.id
       JOIN permissions p ON p.id=rp.permission_id
      WHERE ur.user_id=$1
      ORDER BY p.code`,
    [userId],
  );
  return result.rows.map((row) => row.code);
}

export async function userRoles(userId: string, client?: Queryable): Promise<RoleSummary[]> {
  return (
    await db(client).query<RoleSummary>(
      `SELECT r.id,r.name,r.code FROM user_roles ur JOIN roles r ON r.id=ur.role_id
       WHERE ur.user_id=$1 AND r.is_active=true ORDER BY r.name`,
      [userId],
    )
  ).rows;
}

export async function assignSystemRole(
  userId: string,
  code: string,
  actorId?: string,
  client?: Queryable,
): Promise<void> {
  await db(client).query(
    `INSERT INTO user_roles(user_id,role_id,assigned_by)
     SELECT $1,id,$3 FROM roles WHERE code=$2 ON CONFLICT DO NOTHING`,
    [userId, code, actorId || null],
  );
}

export async function listPermissions(): Promise<PermissionRecord[]> {
  return (
    await pool.query<PermissionRecord>(
      'SELECT id,module,action,code,description FROM permissions ORDER BY module,action',
    )
  ).rows;
}

export async function listRoles(): Promise<RoleRecord[]> {
  const result = await pool.query<{
    id: string;
    name: string;
    code: string;
    description: string | null;
    is_system_role: boolean;
    is_active: boolean;
    version: number;
    created_at: Date;
    updated_at: Date;
  }>('SELECT * FROM roles ORDER BY is_system_role DESC,name');
  return Promise.all(
    result.rows.map(async (row) => {
      const [count, permissions] = await Promise.all([
        pool.query<{ count: string }>(
          'SELECT count(*)::text count FROM user_roles WHERE role_id=$1',
          [row.id],
        ),
        pool.query<PermissionRecord>(
          `SELECT p.id,p.module,p.action,p.code,p.description FROM role_permissions rp
         JOIN permissions p ON p.id=rp.permission_id WHERE rp.role_id=$1 ORDER BY p.module,p.action`,
          [row.id],
        ),
      ]);
      return {
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
        isSystemRole: row.is_system_role,
        isActive: row.is_active,
        version: row.version,
        assignedUsers: Number(count.rows[0]!.count),
        permissions: permissions.rows,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  );
}

export async function createRole(data: {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}): Promise<string> {
  return (
    await pool.query<{ id: string }>(
      `INSERT INTO roles(name,code,description,is_active) VALUES($1,upper($2),$3,$4) RETURNING id`,
      [data.name, data.code, data.description || null, data.isActive],
    )
  ).rows[0]!.id;
}

export async function updateRole(
  id: string,
  data: { name: string; description?: string; isActive: boolean; version: number },
): Promise<boolean> {
  return (
    (
      await pool.query(
        `UPDATE roles SET name=$2,description=$3,is_active=$4,version=version+1,updated_at=now()
      WHERE id=$1 AND version=$5 AND is_system_role=false`,
        [id, data.name, data.description || null, data.isActive, data.version],
      )
    ).rowCount === 1
  );
}

export async function replacePermissions(
  client: PoolClient,
  roleId: string,
  permissionIds: string[],
  version: number,
): Promise<void> {
  const updated = await client.query(
    'UPDATE roles SET version=version+1,updated_at=now() WHERE id=$1 AND version=$2',
    [roleId, version],
  );
  if (updated.rowCount !== 1) throw new Error('ROLE_VERSION_CONFLICT');
  await client.query('DELETE FROM role_permissions WHERE role_id=$1', [roleId]);
  for (const permissionId of permissionIds)
    await client.query('INSERT INTO role_permissions(role_id,permission_id) VALUES($1,$2)', [
      roleId,
      permissionId,
    ]);
}

export async function replaceUserRoles(
  client: PoolClient,
  userId: string,
  roleIds: string[],
  actorId: string,
): Promise<void> {
  await client.query('DELETE FROM user_roles WHERE user_id=$1', [userId]);
  for (const roleId of roleIds)
    await client.query('INSERT INTO user_roles(user_id,role_id,assigned_by) VALUES($1,$2,$3)', [
      userId,
      roleId,
      actorId,
    ]);
}

export async function deleteRole(id: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE authorization_audit_logs SET target_role_id=NULL WHERE target_role_id=$1',
      [id],
    );
    const deleted = await client.query('DELETE FROM roles WHERE id=$1 AND is_system_role=false', [
      id,
    ]);
    await client.query('COMMIT');
    return deleted.rowCount === 1;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function audit(data: {
  actorId: string;
  targetUserId?: string;
  targetRoleId?: string;
  action: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  await pool.query(
    `INSERT INTO authorization_audit_logs(actor_user_id,target_user_id,target_role_id,action,before_state,after_state)
     VALUES($1,$2,$3,$4,$5,$6)`,
    [
      data.actorId,
      data.targetUserId || null,
      data.targetRoleId || null,
      data.action,
      data.before ? JSON.stringify(data.before) : null,
      data.after ? JSON.stringify(data.after) : null,
    ],
  );
}

export async function auditLogs(limit = 100) {
  return (
    await pool.query(
      `SELECT l.id,l.action,l.before_state "beforeState",l.after_state "afterState",l.created_at "createdAt",
      concat(u.first_name,' ',u.last_name) "actorName",l.target_user_id "targetUserId",l.target_role_id "targetRoleId"
     FROM authorization_audit_logs l LEFT JOIN users u ON u.id=l.actor_user_id
     ORDER BY l.created_at DESC LIMIT $1`,
      [limit],
    )
  ).rows;
}
