import { paginationMetaSchema } from "@/lib/api/types";
import { fixedDateFromPrisma } from "@/lib/date";
import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

export const listSuppliersSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
  countryId: z.coerce.number().int().positive().optional(),
});

// Supplier form validation schema (create)
export const supplierFormSchema = z.object({
  // Required fields
  MPDescripcion: z
    .string()
    .min(1, "Description is required")
    .max(40, "Description must be 40 characters or less"),

  MPResponsable: z
    .string()
    .min(1, "Responsible is required")
    .max(30, "Responsible must be 30 characters or less"),

  MPDireccion: z
    .string()
    .min(1, "Address is required")
    .max(50, "Address must be 50 characters or less"),

  MPCiudadId: z
    .number({
      error: "City is required",
    })
    .min(1, "Please select a valid city"),

  MPTelefono1: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),

  MPCorreo1: z.email("Please enter a valid email address"),

  MPNro: z
    .string()
    .min(1, "Supplier number is required")
    .regex(/^\d+$/, "Must be a number")
    .refine(
      (val) => val.length >= 6 && val.length <= 13,
      "Must have between 6 and 13 digits",
    ),

  // Optional fields
  MPTelefono2: nullableOptional(
    z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  ),

  MPCorreo2: nullableOptional(z.email("Please enter a valid email address")),

  MPRetencion: z.enum(["SI", "NO"]),
});

export const updateSupplierSchema = supplierFormSchema.partial();

export const supplierResponseSchema = supplierFormSchema.extend({
  MPId: z.number().int().positive(),
  MPOrgSecuencia: z.number().int().positive(),
  MPOrganizationId: z.string(),
  ciudad: z.object({
    id: z.number().int().positive(),
    nombre: z.string(),
    estado: z.object({
      id: z.number().int().positive(),
      nombre: z.string(),
      pais: z.object({
        id: z.number().int().positive(),
        nombre: z.string(),
      }),
    }),
  }),
});

export const supplierResponseListSchema = z.object({
  data: z.array(supplierResponseSchema),
  pagination: paginationMetaSchema,
});

export type CreateSupplierDTO = z.infer<typeof supplierFormSchema>;
export type UpdateSupplierDTO = z.infer<typeof updateSupplierSchema>;

export type SupplierResponse = z.infer<typeof supplierResponseSchema>;
export type SupplierResponseList = z.infer<typeof supplierResponseListSchema>;
export type ListSuppliersParams = z.infer<typeof listSuppliersSchema>;
