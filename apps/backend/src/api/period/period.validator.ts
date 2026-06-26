import { z } from "zod";

export const setActiveSchema = z.object({
  mes: z.number().int().min(1).max(12),
  ano: z.number().int().min(0).max(99),
});

export type SetActiveDto = z.infer<typeof setActiveSchema>;

export const periodQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  ano: z.coerce.number().int().min(0).max(99),
});

export type PeriodQueryDto = z.infer<typeof periodQuerySchema>;

export const closePeriodSchema = setActiveSchema;

export type ClosePeriodDto = z.infer<typeof closePeriodSchema>;
