import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

export const listVendorsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

export const createVendorSchema = z.object({
  VNombre: z
    .string({ message: "Vendor name is required." })
    .trim()
    .min(1, "Vendor name cannot be empty.")
    .max(200, "Vendor name cannot exceed 200 characters."),
  VCorreo: z.email("Email must be a valid email."),
  VTelefono: z
    .string({ message: "Phone is required." })
    .trim()
    .min(1, "Phone cannot be empty.")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone must have a valid international format (e.g. +573011234567).",
    ),
  VNitCedula: z
    .string({ message: "NIT/Cedula is required." })
    .trim()
    .min(1, "NIT/Cedula cannot be empty.")
    .max(20, "NIT/Cedula cannot exceed 20 characters."),
});

export const updateVendorSchema = createVendorSchema.partial();

export const vendorResponseSchema = createVendorSchema.extend({
  VId: z.number().int().positive(),
  VOrganizationId: z.string(),
  VOrgSecuencia: z.number().int().positive(),
  creadoOModificado: z.string().optional(),
  usuario: z.string().optional(),
});

export const vendorResponseListSchema = z.object({
  data: z.array(vendorResponseSchema),
  pagination: paginationMetaSchema,
});

export type ListVendorsParams = z.infer<typeof listVendorsSchema>;
export type CreateVendorDto = z.infer<typeof createVendorSchema>;
export type UpdateVendorDto = z.infer<typeof updateVendorSchema>;
export type VendorResponse = z.infer<typeof vendorResponseSchema>;
export type VendorResponseList = z.infer<typeof vendorResponseListSchema>;
