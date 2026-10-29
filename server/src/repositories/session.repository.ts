import type { PoolClient } from 'pg';
export interface SessionRecord {
  id: string;
  family_id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by: string | null;
}
export async function createSession(
  client: PoolClient,
  userId: string,
  familyId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<SessionRecord> {
  return (
    await client.query<SessionRecord>(
      'INSERT INTO refresh_sessions(user_id,family_id,token_hash,expires_at) VALUES($1,$2,$3,$4) RETURNING *',
      [userId, familyId, tokenHash, expiresAt],
    )
  ).rows[0]!;
}
export async function findSessionForUpdate(
  client: PoolClient,
  hash: string,
): Promise<SessionRecord | undefined> {
  return (
    await client.query<SessionRecord>(
      'SELECT * FROM refresh_sessions WHERE token_hash=$1 FOR UPDATE',
      [hash],
    )
  ).rows[0];
}
export async function replaceSession(
  client: PoolClient,
  oldId: string,
  newId: string,
): Promise<void> {
  await client.query(
    'UPDATE refresh_sessions SET revoked_at=now(),replaced_by=$2,last_used_at=now() WHERE id=$1',
    [oldId, newId],
  );
}
export async function revokeSession(client: PoolClient, hash: string): Promise<void> {
  await client.query(
    'UPDATE refresh_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE token_hash=$1',
    [hash],
  );
}
export async function revokeFamily(client: PoolClient, familyId: string): Promise<void> {
  await client.query(
    'UPDATE refresh_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE family_id=$1',
    [familyId],
  );
}
export async function revokeUserSessions(client: PoolClient, userId: string): Promise<void> {
  await client.query(
    'UPDATE refresh_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE user_id=$1',
    [userId],
  );
}
