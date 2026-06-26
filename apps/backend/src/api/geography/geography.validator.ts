import { z } from "zod";

// --- País ---
export const paisSchema = z.object({
  nombre: z.string().min(1, "The name is required."),
  codigo: z.string().min(2, "The code must be at least 2 characters.").max(3),
});
export const actualizarPaisSchema = paisSchema.partial();
export type PaisDto = z.infer<typeof paisSchema>;

// --- Estado ---
export const estadoSchema = z.object({
  nombre: z.string().min(1, "The name is required."),
  paisId: z.number().int().positive("The country ID is required."),
});
export const actualizarEstadoSchema = estadoSchema.partial();
export type EstadoDto = z.infer<typeof estadoSchema>;

// --- Ciudad ---
export const ciudadSchema = z.object({
  nombre: z.string().min(1, "The name is required."),
  estadoId: z.number().int().positive("The state ID is required."),
});
export const actualizarCiudadSchema = ciudadSchema.partial();
export type CiudadDto = z.infer<typeof ciudadSchema>;

// --- Esquemas de Listado ---
export const listCiudadesConRelacionesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
});
