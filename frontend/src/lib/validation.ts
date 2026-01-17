import { z } from 'zod';

export const tankCreateSchema = z.object({
  name: z.string().min(1, 'Tank name is required').max(100, 'Tank name must be less than 100 characters'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  fuel_type: z.enum(['diesel', 'gasoline', 'other'] as const),
  capacity: z.number().positive('Capacity must be a positive number').max(1000000, 'Capacity cannot exceed 1,000,000 bbl'),
  initial_level: z.number().min(0, 'Initial level cannot be negative').optional()
});

export const tankUpdateSchema = tankCreateSchema.partial();

export const movementCreateSchema = z.object({
  type: z.enum(['load', 'discharge', 'transfer', 'adjustment'] as const),
  tank_id: z.string().min(1, 'Tank is required'),
  target_tank_id: z.string().optional(),
  expected_volume: z.number().positive('Volume must be a positive number').max(1000000, 'Volume cannot exceed 1,000,000 bbl'),
  scheduled_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export const movementUpdateSchema = z.object({
  scheduled_date: z.string().optional(),
  expected_volume: z.number().positive('Volume must be a positive number').max(1000000, 'Volume cannot exceed 1,000,000 bbl').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export const transferCreateSchema = z.object({
  source_tank_id: z.string().min(1, 'Source tank is required'),
  targets: z.array(z.object({
    tank_id: z.string().min(1, 'Target tank is required'),
    volume: z.number().positive('Volume must be a positive number')
  })).min(1, 'At least one target tank is required'),
  scheduled_date: z.string().min(1, 'Date is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export const adjustmentCreateSchema = z.object({
  tank_id: z.string().min(1, 'Tank is required'),
  physical_level: z.number().min(0, 'Physical level cannot be negative'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
});

export const movementCompleteSchema = z.object({
  actual_volume: z.number().positive('Volume must be a positive number')
});

export type TankCreateInput = z.infer<typeof tankCreateSchema>;
export type TankUpdateInput = z.infer<typeof tankUpdateSchema>;
export type MovementCreateInput = z.infer<typeof movementCreateSchema>;
export type MovementUpdateInput = z.infer<typeof movementUpdateSchema>;
export type TransferCreateInput = z.infer<typeof transferCreateSchema>;
export type AdjustmentCreateInput = z.infer<typeof adjustmentCreateSchema>;
export type MovementCompleteInput = z.infer<typeof movementCompleteSchema>;
