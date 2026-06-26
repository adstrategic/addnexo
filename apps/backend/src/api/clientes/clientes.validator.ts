import { z } from "zod";

import { nullableOptional } from "../../lib/utils.js";

// ===== ESQUEMAS DE VALIDACIÓN =====

// Esquema para listado de clientes
export const listClientesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
});

// Esquema para obtener cliente por secuencia
export const getClienteBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Esquema para obtener cliente por ID
export const getClienteByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Esquema para la creación de cliente
export const crearClienteSchema = z.object({
  CCiudadId: z.coerce
    .number({ error: "City ID is required" })
    .int()
    .positive("City ID must be a positive number"),

  CVendedorVId: nullableOptional(
    z.coerce.number().int().positive("Vendor ID must be a positive number"),
  ),

  CNitCedula: z.string({ error: "NIT/Cedula is required" }),

  CRazonSocial: z
    .string({ error: "Business name is required" })
    .min(1, "Business name cannot be empty")
    .max(30, "Business name cannot exceed 30 characters"),

  CNombreCliente: z
    .string({ error: "Customer name is required" })
    .min(1, "Customer name cannot be empty"),

  CDireccion: z
    .string({ error: "Address is required" })
    .min(1, "Address cannot be empty")
    .max(30, "Address cannot exceed 30 characters"),

  CTelefono1: z
    .string()
    .min(1, "The phone is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "The phone must have a valid international format (e.g. +573011234567)",
    ),

  CTelefono2: nullableOptional(
    z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        "The phone must have a valid international format (e.g. +573011234567)",
      ),
  ),

  CCorreo1: z.email("Email 1 must be a valid email"),

  CCorreo2: nullableOptional(z.email("Email 2 must be a valid email")),

  CDiasParaVencerFactura: z.coerce
    .number()
    .int()
    .min(0, "Days to expire must be 0 or greater")
    .max(99, "Days to expire cannot exceed 99")
    .default(30),

  CRecordatorioPostVencido: z.coerce
    .number()
    .int()
    .min(0, "Reminder days must be 0 or greater")
    .max(99, "Reminder days cannot exceed 99")
    .default(0),

  CCupoAutorizado: z.coerce.number().int().nonnegative().default(0),

  CAbonos: z.coerce.number().int().nonnegative().default(0),

  CFechaIngreso: z.coerce.date({
    error: "Registration date is required",
  }),
});

// Esquema para la actualización (campos opcionales)
export const actualizarClienteSchema = crearClienteSchema.partial();

// Tipos para usar en el resto de la aplicación
export type CrearClienteDto = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteDto = z.infer<typeof actualizarClienteSchema>;
export type ListClientesQuery = z.infer<typeof listClientesSchema>;
