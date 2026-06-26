import { z } from "zod";

// ===== ESQUEMAS DE VALIDACIÓN =====

// Esquema para listado de vendedores
export const listVendedoresSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
});

// Esquema para obtener vendedor por secuencia
export const getVendedorBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Esquema para obtener vendedor por ID
export const getVendedorByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Esquema para la creación de vendedor
export const crearVendedorSchema = z.object({
  VNombre: z
    .string({ error: "First name is required" })
    .min(1, "First name cannot be empty")
    .max(200, "First name cannot exceed 50 characters"),

  VCorreo: z.email("Email must be a valid email"),

  VTelefono: z
    .string({ error: "Phone is required" })
    .min(1, "Phone cannot be empty")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone must have a valid international format (e.g. +573011234567)",
    ),

  VNitCedula: z
    .string({ error: "NIT/Cedula is required" })
    .min(1, "NIT/Cedula cannot be empty")
    .max(20, "NIT/Cedula cannot exceed 20 characters"),
});

// Esquema para la actualización (campos opcionales)
export const actualizarVendedorSchema = crearVendedorSchema.partial();

// Tipos para usar en el resto de la aplicación
export type CrearVendedorDto = z.infer<typeof crearVendedorSchema>;
export type ActualizarVendedorDto = z.infer<typeof actualizarVendedorSchema>;
export type ListVendedoresQuery = z.infer<typeof listVendedoresSchema>;
