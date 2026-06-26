import { z } from "zod";

export const listBanksSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  search: z.string().optional(),
});

export const getBankBySequenceSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

export const createBankSchema = z.object({
  BNombre: z
    .string()
    .min(1, "Bank name is required")
    .max(100, "Bank name cannot exceed 100 characters")
    .trim(),
});

export const updateBankSchema = z.object({
  BNombre: z
    .string()
    .min(1, "Bank name is required")
    .max(100, "Bank name cannot exceed 100 characters")
    .trim(),
});

export const deleteBankSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

export type CreateBankDto = z.infer<typeof createBankSchema>;
export type UpdateBankDto = z.infer<typeof updateBankSchema>;
export type ListBanksQuery = z.infer<typeof listBanksSchema>;
