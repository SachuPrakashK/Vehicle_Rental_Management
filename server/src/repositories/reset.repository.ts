import type { PoolClient } from 'pg';
export interface ResetRecord {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
}
export async function createReset(
  client: PoolClient,
  userId: string,
  hash: string,
  expiresAt: Date,
): Promise<void> {
  await client.query(
    'UPDATE password_reset_tokens SET used_at=COALESCE(used_at,now()) WHERE user_id=$1 AND used_at IS NULL',
    [userId],
  );
  await client.query(
    'INSERT INTO password_reset_tokens(user_id,token_hash,expires_at) VALUES($1,$2,$3)',
    [userId, hash, expiresAt],
  );
}
export async function findResetForUpdate(
  client: PoolClient,
  hash: string,
): Promise<ResetRecord | undefined> {
  return (
    await client.query<ResetRecord>(
      'SELECT * FROM password_reset_tokens WHERE token_hash=$1 FOR UPDATE',
      [hash],
    )
  ).rows[0];
}
export async function useReset(client: PoolClient, id: string): Promise<void> {
  await client.query('UPDATE password_reset_tokens SET used_at=now() WHERE id=$1', [id]);
}
