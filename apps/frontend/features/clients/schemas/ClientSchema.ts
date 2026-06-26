import { paginationMetaSchema } from "@/lib/api/types";
import { fixedDateFromPrisma } from "@/lib/date";
import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

/**
 * Form schema (client-side validation)
 */
export const clientFormSchema = z.object({
  // Required fields
  CNitCedula: z
    .string()
    .min(1, "NIT/ID is required")
    .max(20, "NIT/ID must be 20 characters or less")
    .regex(/^[0-9-]+$/, "NIT/ID must contain only numbers and hyphens"),

  CRazonSocial: z
    .string()
    .min(1, "Business name is required")
    .max(100, "Business name must be 100 characters or less"),

  CNombreCliente: z
    .string()
    .min(1, "Client name is required")
    .max(100, "Client name must be 100 characters or less"),

  CDireccion: z
    .string()
    .min(1, "Address is required")
    .max(200, "Address must be 200 characters or less"),

  CTelefono1: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),

  CCorreo1: z
    .email("Please enter a valid email address")
    .max(100, "Email must be 100 characters or less"),

  CCiudadId: z
    .number({
      error: "City is required",
    })
    .min(1, "Please select a valid city"),

  // Optional fields
  CTelefono2: nullableOptional(
    z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  ),

  CCorreo2: nullableOptional(
    z
      .email("Please enter a valid email address")
      .max(100, "Email must be 100 characters or less"),
  ),

  CVendedorVId: z.coerce
    .number<number>()
    .int()
    .positive("Please select a valid vendor"),

  // Business terms

  CDiasParaVencerFactura: z.coerce
    .number<number>()
    .int("Days must be a whole number")
    .min(0, "Days must be 0 or greater")
    .max(365, "Days cannot exceed 365"),

  CRecordatorioPostVencido: z.coerce
    .number<number>()
    .int("Reminder days must be a whole number")
    .min(0, "Reminder days must be 0 or greater")
    .max(365, "Reminder days cannot exceed 365"),

  CCupoAutorizado: z.coerce
    .number<number>()
    .min(0, "Credit limit must be 0 or greater"),

  CAbonos: z.coerce.number<number>().min(0, "Payments must be 0 or greater"),

  CFechaIngreso: z.date({
    error: "Registration date is required",
  }),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

/**
 * API response schemas
 */
export const clientResponseSchema = z.object({
  CId: z.number().int().positive(),
  COrgSecuencia: z.number().int().positive(),
  CNitCedula: z.string(),
  CRazonSocial: z.string(),
  CNombreCliente: z.string(),
  CDireccion: z.string(),
  CCiudadId: z.number().int().positive(),
  CVendedorVId: z.number().int().positive(),
  CTelefono1: z.string(),
  CTelefono2: z.string().nullable(),
  CCorreo1: z.email(),
  CCorreo2: z.email().nullable(),
  CDiasParaVencerFactura: z.number().int(),
  CRecordatorioPostVencido: z.number().int(),
  CFechaIngreso: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val))),
  CCupoAutorizado: z.number(),
  CAbonos: z.number(),
  creadoOModificado: z.string(),
  usuario: z.string(),
  ciudad: z.any(),
  vendedor: z.any().optional(),
});

export const clientResponseListSchema = z.object({
  data: z.array(clientResponseSchema),
  pagination: paginationMetaSchema,
});

export const listClientsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

export type ClienteResponse = z.infer<typeof clientResponseSchema>;
export type ClientesResponse = z.infer<typeof clientResponseListSchema>;
export type ListClientsParams = z.infer<typeof listClientsSchema>;

export type CreateClientDto = ClientFormData;
export type UpdateClientDto = Partial<ClientFormData>;

// Backwards compatible alias
export type ActualizarClienteData = UpdateClientDto;
