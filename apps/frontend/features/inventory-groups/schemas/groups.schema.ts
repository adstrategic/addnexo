import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Schema for listing groups (query params)
 */
export const listGroupsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

/**
 * Group validation schema.
 * Matches backend groups.validator.ts groupsMedidaSchema.
 */
export const createGroupSchema = z.object({
  GDescripcion: z
    .string({ error: "The description is required." })
    .min(1, "The description cannot be empty.")
    .max(30),

  GNro: z
    .number({ error: "The group number is required." })
    .int()
    .min(1, "The group number must be greater than 0.")
    .max(999, "The group number cannot exceed 999."),
});

/**
 * Update group schema (all fields optional)
 */
export const updateGroupSchema = createGroupSchema.partial();

/**
 * Group response schema from API.
 * Matches backend UnidadMedida entity shape.
 */
export const groupResponseSchema = createGroupSchema.extend({
  GId: z.number().int().positive(),
  GOrgSecuencia: z.number().int().positive(),
  GOrganizationId: z.string(),
});

/**
 * List response: { data: GroupResponse[], pagination: PaginationMeta }
 */
export const groupResponseListSchema = z.object({
  data: z.array(groupResponseSchema),
  pagination: paginationMetaSchema,
});

export type CreateGroupDto = z.infer<typeof createGroupSchema>;
export type UpdateGroupDto = z.infer<typeof updateGroupSchema>;
export type GroupResponse = z.infer<typeof groupResponseSchema>;
export type GroupResponseList = z.infer<typeof groupResponseListSchema>;
export type ListGroupsParams = z.infer<typeof listGroupsSchema>;
