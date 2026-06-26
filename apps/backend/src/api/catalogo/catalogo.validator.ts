import { z } from "zod";

export const listProductosSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  grupoId: z.coerce.number().int().positive().optional(),
  grupoNro: z.coerce.number().int().positive().optional(),
  /** Filter by product origin country (Invcaruni.CKOrigenId). */
  paisId: z.coerce.number().int().positive().optional(),
  unidadMedidaId: z.coerce.number().int().positive().optional(),
  excludeGrupoNro: z.coerce.number().int().positive().optional(),
});

// Esquema para obtener producto por secuencia
export const getProductoBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

export const crearProductoSchema = z.object({
  CKGrupoId: z
    .number({
      error: "Group is required",
    })
    .int()
    .positive("Group is required"),

  CKUnidadMedidaId: z
    .number({
      error: "Unit is required",
    })
    .int()
    .positive("Unit is required"),
  CKDescripcion: z
    .string({ error: "Description is required" })
    .trim()
    .min(1, "Description is required")
    .max(40, "Description cannot exceed 40 characters"),
  CKOrigenId: z
    .number({
      error: "Origin country is required.",
    })
    .int()
    .positive("Origin country is required."),
  CKPrecioPublico: z.number().nonnegative(),
  CKPrecioVenta1: z.number().nonnegative(),
  CKPrecioVenta2: z.number().nonnegative(),
  CKPesoPromedioKg: z
    .number({
      error: "Average weight in KG is required",
    })
    .nonnegative("Average weight in KG cannot be negative"),
  CKPorcenMargen: z
    .number({
      error: "Margin percentage is required",
    })
    .min(0, "Margin percentage must be 0 or greater")
    .max(100, "Margin percentage cannot exceed 100"),
  CKPorcenMargenTopeDesc: z.number().nonnegative().max(100),
  CKTopeDescuento: z.number().nonnegative(),
  CKIva: z.number().nonnegative().max(100).optional().default(0),
  CKExento: z.boolean().optional().default(false),
});

export const actualizarProductoSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("The ID must be a positive number"),
  }),
  body: crearProductoSchema.partial(),
};

// Esquema para la eliminación - inherits all the same behavior from create schema
export const eliminarProductoSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// ===== DTOs (para el servicio) =====

export type CrearProductoDto = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoDto = z.infer<
  typeof actualizarProductoSchema.body
>;
