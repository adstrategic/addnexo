import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Query params for listing/searching cities.
 * Align with backend when geography routes are added.
 */
export const listCitiesParamsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(100).optional(),
  search: z.string().optional(),
});

/** Minimal país shape for nested display in selectors */
export const cityPaisSchema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  codigo: z.string().optional(),
});

/** Estado with nested país (Spanish API keys) */
export const cityEstadoSchema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  label: z.string().optional(),
  pais: cityPaisSchema,
});

/**
 * City row returned by list/detail APIs.
 * Extra fields are allowed for forward compatibility with the future backend.
 */
export const cityResponseSchema = z
  .object({
    id: z.number().int(),
    nombre: z.string(),
    estadoId: z.number().int().optional(),
    estado: cityEstadoSchema,
    organizacionId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    fromOrganization: z.boolean().optional(),
  })
  .loose();

export const cityListResponseSchema = z.object({
  data: z.array(cityResponseSchema),
  pagination: paginationMetaSchema,
});

export type ListCitiesParams = z.infer<typeof listCitiesParamsSchema>;
export type CityPais = z.infer<typeof cityPaisSchema>;
export type CityEstado = z.infer<typeof cityEstadoSchema>;
export type CityResponse = z.infer<typeof cityResponseSchema>;
export type CityListResponse = z.infer<typeof cityListResponseSchema>;
