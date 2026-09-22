import { z } from "zod";

// Validation boundary for anything arriving from the client, before it's
// forwarded to the ML service. Mirrors services/ml/app/schema.py's bounds.
export const assessRequestSchema = z.object({
  age: z.number().min(10).max(90),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(20).max(250),
  cycle_regularity: z.boolean(),
  period_duration_days: z.number().min(0).max(30).nullable().optional(),
  weight_gain: z.boolean().nullable().optional(),
  hair_growth: z.boolean().nullable().optional(),
  skin_darkening: z.boolean().nullable().optional(),
  hair_loss: z.boolean().nullable().optional(),
  pimples: z.boolean().nullable().optional(),
  fast_food: z.boolean().nullable().optional(),
  regular_exercise: z.boolean().nullable().optional(),
});

export type AssessRequestInput = z.infer<typeof assessRequestSchema>;
