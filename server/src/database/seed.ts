import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool } from '../config/database.js';
if (!env.SEED_SUPER_ADMIN_EMAIL || !env.SEED_SUPER_ADMIN_PASSWORD)
  throw new Error('Seed credentials are not configured.');
const passwordHash = await bcrypt.hash(env.SEED_SUPER_ADMIN_PASSWORD, 12);
await pool.query(
  `INSERT INTO users(first_name,last_name,email,phone,password_hash,role,is_active)
VALUES('Fleetline','Administrator',$1,NULL,$2,'SUPER_ADMIN',true)
ON CONFLICT DO NOTHING`,
  [env.SEED_SUPER_ADMIN_EMAIL.toLowerCase(), passwordHash],
);
await pool.end();
