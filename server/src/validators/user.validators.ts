import { z } from 'zod';
import { passwordSchema } from './auth.validators.js';
const phone = z
  .string()
  .regex(/^\d{10}$/)
  .nullable()
  .optional();
export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone,
});
export const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  phone,
  password: passwordSchema,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF']).default('STAFF'),
  isActive: z.boolean().default(true),
});
export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  phone,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STAFF']),
  isActive: z.boolean(),
});
