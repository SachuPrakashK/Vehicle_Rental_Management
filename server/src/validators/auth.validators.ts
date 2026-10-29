import { z } from 'zod';
export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/\d/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a special character');
const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Enter a 10-digit phone number')
  .optional()
  .or(z.literal(''));
export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().transform((value) => value.toLowerCase()),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });
export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});
export const forgotPasswordSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});
export const resetTokenSchema = z.object({ token: z.string().min(32).max(200) });
export const resetPasswordSchema = z
  .object({
    token: z.string().min(32).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });
