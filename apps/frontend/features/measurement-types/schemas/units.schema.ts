import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Schema for listing units (query params)
 */
export const listUnitsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

/**
 * Unit validation schema.
 * Matches backend unidades.validator.ts unidadMedidaSchema.
 */
export const createUnitSchema = z.object({
  UMNombre: z
    .string({ message: "Unit name/code is required." })
    .trim()
    .min(1, "Unit name cannot be empty.")
    .max(10, "Unit name cannot exceed 10 characters."),
  UMDescripcion: z
    .string({ message: "Description is required." })
    .trim()
    .min(1, "Description cannot be empty.")
    .max(30, "Description cannot exceed 30 characters."),
});

/**
 * Update unit schema (all fields optional)
 */
export const updateUnitSchema = createUnitSchema.partial();

/**
 * Unit response schema from API.
 * Matches backend UnidadMedida entity shape.
 */
export const unitResponseSchema = createUnitSchema.extend({
  UMId: z.number().int().positive(),
  UMOrgSecuencia: z.number().int().positive(),
  UMOrganizationId: z.string(),
});

/**
 * List response: { data: UnitResponse[], pagination: PaginationMeta }
 */
export const unitResponseListSchema = z.object({
  data: z.array(unitResponseSchema),
  pagination: paginationMetaSchema,
});

export type CreateUnitDto = z.infer<typeof createUnitSchema>;
export type UpdateUnitDto = z.infer<typeof updateUnitSchema>;
export type UnitResponse = z.infer<typeof unitResponseSchema>;
export type UnitResponseList = z.infer<typeof unitResponseListSchema>;
export type ListUnitsParams = z.infer<typeof listUnitsSchema>;
