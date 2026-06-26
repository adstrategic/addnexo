import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Schema for listing banks (query params)
 */
export const listBanksSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

/**
 * Bank validation schema.
 * Matches backend banks.validator.ts createBankSchema.
 */
export const createBankSchema = z.object({
  BNombre: z
    .string({ message: "Bank name is required." })
    .trim()
    .min(1, "Bank name cannot be empty.")
    .max(100, "Bank name cannot exceed 100 characters."),
});

/**
 * Update bank schema. The backend requires the name on update, so the shape
 * matches createBankSchema.
 */
export const updateBankSchema = createBankSchema;

/** Bank (Prisma `Bank`, serialized). */
export const bankResponseSchema = createBankSchema.extend({
  BId: z.number().int().positive(),
  BOrgSecuencia: z.number().int().positive(),
  BOrganizationId: z.string(),
  creadoOModificado: z.string(),
  usuario: z.string(),
});

/**
 * List response: { data: BankResponse[], pagination: PaginationMeta }
 */
export const bankResponseListSchema = z.object({
  data: z.array(bankResponseSchema),
  pagination: paginationMetaSchema,
});

export type CreateBankDto = z.infer<typeof createBankSchema>;
export type UpdateBankDto = z.infer<typeof updateBankSchema>;
export type BankResponse = z.infer<typeof bankResponseSchema>;
export type BanksResponse = z.infer<typeof bankResponseListSchema>;
export type ListBanksParams = z.infer<typeof listBanksSchema>;
