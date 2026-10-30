import crypto from 'node:crypto';
import pg from 'pg';
import { env } from './env.js';

async function createPool(): Promise<pg.Pool> {
  if (env.NODE_ENV === 'test' && env.DATABASE_URL.startsWith('pg-mem://')) {
    const { DataType, newDb } = await import('pg-mem');
    const memory = newDb({ autoCreateForeignKeyIndices: true });
    memory.registerExtension('pgcrypto', (schema) => {
      schema.registerFunction({
        name: 'gen_random_uuid',
        returns: DataType.uuid,
        impure: true,
        implementation: () => crypto.randomUUID(),
      });
    });
    const adapter = memory.adapters.createPg();
    return new adapter.Pool() as unknown as pg.Pool;
  }
  return new pg.Pool({
    connectionString: env.DATABASE_URL,
    ssl:
      env.NODE_ENV !== 'production' || env.DATABASE_SSL_MODE === 'disable'
        ? undefined
        : {
            rejectUnauthorized: env.DATABASE_SSL_MODE === 'verify-full',
            ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, '\n') } : {}),
          },
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DATABASE_CONNECTION_TIMEOUT_MS,
  });
}

export const pool = await createPool();
pool.on('error', () => {
  process.exitCode = 1;
});
