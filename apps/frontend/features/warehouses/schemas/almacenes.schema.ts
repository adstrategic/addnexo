import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Schema for listing almacenes (query params)
 */
export const listAlmacenesSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

/**
 * Almacen (warehouse) validation schema.
 * Matches backend almacenes.validator.ts almacenSchema.
 */
export const createAlmacenSchema = z.object({
  ALCiudadId: z
    .number({ message: "You need to assign a city." })
    .int()
    .positive("The selected city is not valid"),
  ALNombre: z
    .string({ message: "The name is required." })
    .min(1, "The name cannot be empty.")
    .max(50),
  ALResponsable: z
    .string({ message: "The responsible is required." })
    .min(1)
    .max(50),
  ALDireccion: z
    .string({ message: "The address is required." })
    .min(1)
    .max(50),
  ALTelefono: z
    .string()
    .min(1, "The phone is required.")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "The phone must have a valid international format (e.g. +573011234567)",
    ),
});

/**
 * Update almacen schema (all fields optional)
 */
export const updateAlmacenSchema = createAlmacenSchema.partial();

/** Nested ciudad shape for API response (permissive for Prisma include) */
const ciudadResponseSchema = z
  .object({
    id: z.number(),
    nombre: z.string().optional(),
    estado: z
      .object({
        id: z.number(),
        nombre: z.string().optional(),
        pais: z
          .object({
            id: z.number(),
            nombre: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

/**
 * Almacen response schema from API.
 * Matches backend Almacen entity shape (with optional ciudad include).
 */
export const almacenResponseSchema = createAlmacenSchema.extend({
  ALId: z.number().int().positive(),
  ALOrgSecuencia: z.number().int().positive(),
  ALOrganizationId: z.string(),
  creadoOModificado: z.union([z.string(), z.date()]).optional(),
  usuario: z.string().optional(),
  ciudad: ciudadResponseSchema.optional(),
});

/**
 * List response: { data: AlmacenResponse[], pagination: PaginationMeta }
 */
export const almacenResponseListSchema = z.object({
  data: z.array(almacenResponseSchema),
  pagination: paginationMetaSchema,
});

export type CreateAlmacenDto = z.infer<typeof createAlmacenSchema>;
export type UpdateAlmacenDto = z.infer<typeof updateAlmacenSchema>;
export type AlmacenResponse = z.infer<typeof almacenResponseSchema>;
export type AlmacenResponseList = z.infer<typeof almacenResponseListSchema>;
export type ListAlmacenesParams = z.infer<typeof listAlmacenesSchema>;
