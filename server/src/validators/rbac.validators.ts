import { z } from 'zod';

export const roleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9_]{1,79}$/),
  description: z.string().trim().max(300).optional().default(''),
  isActive: z.boolean().default(true),
});

export const updateRoleSchema = roleSchema.omit({ code: true }).extend({
  version: z.number().int().positive(),
});

export const permissionAssignmentSchema = z.object({
  permissionIds: z.array(z.string().uuid()).max(100),
  version: z.number().int().positive(),
});

export const roleAssignmentSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1).max(10),
});
