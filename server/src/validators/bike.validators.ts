import { z } from 'zod';

export const bikeSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.number().int().min(1900).max(2200),
  color: z.string().trim().max(40).nullable().optional(),
  dailyRate: z.number().positive().max(100000000),
  image: z.string().trim().max(2048).nullable().optional(),
  registrationNumber: z.string().trim().min(1).max(30),
  available: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).default('ACTIVE'),
});
