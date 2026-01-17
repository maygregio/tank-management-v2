import { z } from 'zod';

export const tankCreateSchema = z.object({
  name: z.string().min(1, 'Tank name is required').max(100, 'Tank name must be less than 100 characters'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  feedstock_type: z.enum(['carbon_black_oil', 'other'] as const),
  capacity: z.number().positive('Capacity must be a positive number').max(1000000, 'Capacity cannot exceed 1,000,000 bbl'),
  initial_level: z.number().min(0, 'Initial level cannot be negative').optional()
});

export type TankCreateInput = z.infer<typeof tankCreateSchema>;
