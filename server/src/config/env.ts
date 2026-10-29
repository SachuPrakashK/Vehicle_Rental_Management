import 'dotenv/config';
import { z } from 'zod';

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
);
const optionalEmail = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().email().optional(),
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:4200'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: optionalString,
  UPLOAD_DIRECTORY: z.string().default('uploads/profile-images'),
  VEHICLE_UPLOAD_DIRECTORY: z.string().default('uploads/vehicle-images'),
  IMAGE_UPLOAD_MAX_MB: z.coerce.number().positive().max(20).default(5),
  EXPOSE_DEVELOPMENT_RESET_TOKEN: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z
    .string()
    .default('true')
    .transform((value) => value === 'true'),
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,
  SEED_SUPER_ADMIN_EMAIL: optionalEmail,
  SEED_SUPER_ADMIN_PASSWORD: optionalString,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(
    'Invalid server environment configuration: ' +
      parsed.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join(', '),
  );
}
export const env = parsed.data;
if (env.NODE_ENV === 'production' && (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_FROM)) {
  throw new Error('SMTP configuration is required in production.');
}
if (env.COOKIE_SAME_SITE === 'none' && !env.COOKIE_SECURE) {
  throw new Error('SameSite=None cookies must be Secure.');
}
