import { Producto } from "../types/server-types";
import { z } from "zod";

// Product form validation schema
export const productFormSchema = z.object({
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
      error: "Origin country is required",
    })
    .int()
    .positive("Origin country is required"),

  CKPesoPromedioKg: z
    .number({
      error: "Average weight in KG is required",
    })
    .nonnegative("Average weight in KG cannot be negative"),

  CKPrecioPublico: z
    .number({
      error: "Public price is required",
    })
    .nonnegative("Public price cannot be negative"),

  CKPrecioVenta1: z
    .number({
      error: "Sale price 1 is required",
    })
    .nonnegative("Sale price 1 cannot be negative"),

  CKPrecioVenta2: z
    .number({
      error: "Sale price 2 is required",
    })
    .nonnegative("Sale price 2 cannot be negative"),

  CKPorcenMargen: z
    .number({
      error: "Margin percentage is required",
    })
    .nonnegative("Margin percentage must be 0 or greater")
    .max(100, "Margin percentage cannot exceed 100"),

  CKPorcenMargenTopeDesc: z
    .number({
      error: "Margin discount percentage is required",
    })
    .nonnegative("Margin discount percentage must be 0 or greater")
    .max(100, "Margin discount percentage cannot exceed 100"),

  CKTopeDescuento: z
    .number({
      error: "Discount limit is required",
    })
    .nonnegative("Discount limit must be 0 or greater"),

  CKIva: z
    .number()
    .nonnegative("VAT must be 0 or greater")
    .max(100, "VAT cannot exceed 100"),

  CKExento: z.boolean(),
});

// Infer the type from the schema
export type ProductFormData = z.infer<typeof productFormSchema>;
export type ActualizarProductoData = Partial<z.infer<typeof productFormSchema>>;

// Transform API data to form format (for editing)
export function transformFromApiFormat(apiData: Producto): ProductFormData {
  return {
    CKGrupoId: apiData.CKGrupoId,
    CKDescripcion: apiData.CKDescripcion,
    CKOrigenId: apiData.CKOrigenId,
    CKUnidadMedidaId: apiData.CKUnidadMedidaId,
    CKPesoPromedioKg: Number(apiData.CKPesoPromedioKg),
    CKPrecioPublico: Number(apiData.CKPrecioPublico),
    CKPrecioVenta1: Number(apiData.CKPrecioVenta1),
    CKPrecioVenta2: Number(apiData.CKPrecioVenta2),
    CKPorcenMargen: Number(apiData.CKPorcenMargen),
    CKPorcenMargenTopeDesc: Number(apiData.CKPorcenMargenTopeDesc),
    CKTopeDescuento: Number(apiData.CKTopeDescuento),
    CKIva: Number(apiData.CKIva),
    CKExento: apiData.CKExento,
  };
}
