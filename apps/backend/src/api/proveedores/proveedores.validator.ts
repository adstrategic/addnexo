import { z } from "zod";

// Generic helper for nullable optional fields that converts empty strings to null
const nullableOptional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    schema.nullable().optional(),
  );

// ===== ESQUEMAS DE VALIDACIÓN (para middleware) =====

// Esquema para listado de proveedores
export const listProveedoresSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
});

// Esquema para obtener proveedor por secuencia
export const getProveedorBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Esquema para la creación de un proveedor
export const crearProveedorSchema = z.object({
  // Basado en tu esquema original
  MPDescripcion: z.string().min(1, "The description is required").max(40),
  MPResponsable: z.string().min(1, "The responsible is required").max(30),
  MPDireccion: z.string().min(1, "The address is required").max(50),
  MPCiudadId: z
    .number({
      error: "You need to assign a city",
    })
    .int()
    .positive("The selected city isn't valid"),
  MPTelefono1: z
    .string()
    .min(1, "The phone is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "The phone must have a valid international format (e.g. +573011234567)",
    ),
  MPTelefono2: nullableOptional(
    z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        "The phone must have a valid international format (e.g. +573011234567)",
      ),
  ),
  MPCorreo1: z.email("The email format is invalid"),
  MPCorreo2: nullableOptional(z.email("The email format is invalid")),
  MPNro: z.string().regex(/^\d+$/, "Must be a number").min(6).max(13),
  MPRetencion: z.string().max(2).optional().default(""),
});

// Esquema para la actualización - inherits all the same behavior from create schema
export const actualizarProveedorSchema = {
  params: z.object({
    id: z.coerce.number().int().positive("The ID must be a positive number"),
  }),
  body: crearProveedorSchema.partial(),
};

// Esquema para la eliminación - inherits all the same behavior from create schema
export const eliminarProveedorSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// ===== DTOs (para el servicio) =====

export type CrearProveedorDto = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorDto = z.infer<
  typeof actualizarProveedorSchema.body
>;
