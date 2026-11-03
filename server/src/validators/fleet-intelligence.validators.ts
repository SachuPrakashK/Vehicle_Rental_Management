import { z } from 'zod';

const vehicle = {
  vehicleRef: z.string().trim().min(1).max(100),
  vehicleType: z.enum(['CAR', 'BIKE']),
  registrationNumber: z.string().trim().min(1).max(30),
};

export const maintenanceSchema = z.object({
  ...vehicle,
  maintenanceType: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(500),
  scheduledDate: z.iso.datetime(),
  odometerReading: z.number().int().nonnegative().nullable().optional(),
  estimatedCost: z.number().nonnegative().nullable().optional(),
  actualCost: z.number().nonnegative().nullable().optional(),
  serviceProvider: z.string().trim().max(160).nullable().optional(),
  status: z.enum(['SCHEDULED', 'DUE', 'IN_PROGRESS', 'CANCELLED']).default('SCHEDULED'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const updateMaintenanceSchema = maintenanceSchema.omit({
  vehicleRef: true,
  vehicleType: true,
  registrationNumber: true,
});

export const completeMaintenanceSchema = z.object({
  completedDate: z.iso.datetime(),
  odometerReading: z.number().int().nonnegative(),
  actualCost: z.number().nonnegative().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const scheduleSchema = z
  .object({
    ...vehicle,
    serviceType: z.string().trim().min(2).max(80),
    intervalKm: z.number().int().positive().nullable().optional(),
    intervalDays: z.number().int().positive().nullable().optional(),
    lastServiceDate: z.iso.date().nullable().optional(),
    lastServiceOdometer: z.number().int().nonnegative().nullable().optional(),
    reminderThresholdDays: z.number().int().nonnegative().default(14),
    reminderThresholdKm: z.number().int().nonnegative().default(1000),
  })
  .refine((value) => value.intervalKm || value.intervalDays, {
    message: 'Configure a distance or date interval.',
    path: ['intervalKm'],
  });

export const inspectionSchema = z.object({
  ...vehicle,
  inspectionType: z.enum(['PRE_RENTAL', 'POST_RENTAL', 'ROUTINE']),
  inspectionDate: z.iso.datetime(),
  odometerReading: z.number().int().nonnegative().nullable().optional(),
  checklistResults: z.record(z.string(), z.boolean()).default({}),
  defects: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  status: z.enum(['PASSED', 'ATTENTION', 'FAILED']),
});

export const geofenceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  centerLatitude: z.number().min(-90).max(90),
  centerLongitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(100000),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const alertActionSchema = z.object({
  resolutionNotes: z.string().trim().max(1000).nullable().optional(),
});

export const simulatorSchema = z.object({
  vehicleRef: z.string().trim().min(1).max(100),
  registrationNumber: z.string().trim().min(1).max(30),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).max(300).default(0),
  heading: z.number().min(0).max(360).default(0),
  recordedAt: z.iso.datetime().optional(),
});
