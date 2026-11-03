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
export const createUserSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().transform((value) => value.toLowerCase()),
    phone,
    password: passwordSchema,
    roleIds: z.array(z.string().uuid()).min(1).max(10).optional(),
    role: z.enum(['ADMIN', 'STAFF']).optional(),
    isActive: z.boolean().default(true),
  })
  .refine((input) => input.roleIds?.length || input.role, {
    message: 'Select at least one role.',
    path: ['roleIds'],
  });
export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.email().transform((value) => value.toLowerCase()),
  phone,
  roleIds: z.array(z.string().uuid()).min(1).max(10).optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  isActive: z.boolean(),
});
