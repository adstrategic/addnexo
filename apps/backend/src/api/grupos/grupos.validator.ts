import { z } from "zod";

// ===== ESQUEMAS DE VALIDACIÓN (para middleware) =====

// Esquema para listado de grupos
export const listGruposSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
});

// Esquema para obtener grupo por secuencia
export const getGrupoBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

export const getGrupoByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Esquema para obtener productos por grupo
export const listProductosByGrupoSchema = z.object({
  grupoId: z.coerce
    .number()
    .int()
    .positive("The group ID must be a positive number"),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
});

// Esquema para la creación
export const crearGrupoSchema = z.object({
  GDescripcion: z
    .string({ error: "The description is required." })
    .min(1, "The description cannot be empty.")
    .max(30),

  GNro: z.coerce
    .number({ error: "The group number is required." })
    .int()
    .min(1, "The group number must be greater than 0.")
    .max(999, "The group number cannot exceed 999."),
});

// Esquema para la actualización (campos opcionales)
export const actualizarGrupoSchema = crearGrupoSchema.partial();

export type ActualizarGrupoDto = z.infer<typeof actualizarGrupoSchema>;
// Tipos para usar en el resto de la aplicación
export type CrearGrupoDto = z.infer<typeof crearGrupoSchema>;
