import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

// Factura item schema (matches server request DTO)
// For manual invoices: quantity is always 1, only group 999 items allowed
export const saldosFacturaItemSchema = z.object({
  FUInvcaruniId: z.coerce
    .number({
      error: "Product is required",
    })
    .int()
    .positive("Product is required"),
  // Note: FUCantidad is always 1 for manual invoices, not sent in request
  FUVrUnitario: z
    .number({
      error: "Balance is required",
    })
    .refine(
      (val) =>
        (val > 0 && val <= 9999999.99) || (val < 0 && val >= -9999999.99),
      {
        message: "Balance must be greater or less than 0",
      },
    ),
});

// Schema for updating saldos factura item
export const updateBalanceInvoiceItemSchema = saldosFacturaItemSchema.omit({
  FUInvcaruniId: true,
});

// Base factura schema (matches server request DTO)
const saldosFacturaBaseSchema = z.object({
  // Vendor data
  FGVendedorId: z.coerce
    .number({ error: "Vendor ID is required" })
    .int()
    .positive("Vendor ID must be a positive number"),
  // Customer data
  FGClienteId: z.coerce
    .number({ error: "Customer ID is required" })
    .int()
    .positive("Customer ID must be a positive number"),
  FGPurchaseOrder: nullableOptional(
    z.string().max(50, "Purchase order must be 50 characters or less"),
  ),
  FGNro: z
    .number({ error: "Invoice number is required" })
    .int()
    .positive("Invoice number must be a positive number"),

  // Payment type (CONTADO, CANJE, CREDITO)
  FGPago: z.enum([
    "CONTADO",
    "CANJE",
    "CREDITO",
    "WALLET",
    "CREDIT_CARD",
    "TRANSFER",
    "CHECK",
  ]),
  FGValorTotal: z
    .number({ error: "Total value is required" })
    .positive("Total value must be greater than 0"),

  // Payment conditions (required if FGPago = CREDITO)
  FGCondicion1: z
    .string()
    .max(40, "Condition must be 40 characters or less")
    .optional(),
  FGCondicion2: z
    .string()
    .max(40, "Condition must be 40 characters or less")
    .optional(),
  FGCondicion3: z
    .string()
    .max(40, "Condition must be 40 characters or less")
    .optional(),

  // Other header fields
  FGTelefono1: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  FGTelefono2: nullableOptional(
    z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  ),
  FGCorreo1: z
    .string({ error: "Email 1 is required" })
    .email("Email 1 must be a valid email"),

  FGCorreo2: nullableOptional(
    z.string().email("Email 2 must be a valid email"),
  ),
  FGDireccionEntrega: z
    .string()
    .max(100, "Delivery address must be 100 characters or less")
    .default(""),
  FGCiudadId: z
    .number({
      error: "Delivery city is required",
    })
    .int()
    .positive("Please select a delivery city"),
  FGFechaCreado: z.date({ error: "Issue date is required" }),
  FGFechaVencimiento: z.date({ error: "Due date is required" }),
  // Server expects 'facturau' array in request
  facturau: z
    .array(saldosFacturaItemSchema)
    .min(1, "At least one item is required")
    .max(999, "Cannot exceed 999 items"),
});

// Schema for updating factura (DRAFT only)
export const updateBalanceInvoiceSchema = saldosFacturaBaseSchema
  .partial()
  .extend({
    facturau: z
      .array(saldosFacturaItemSchema)
      .min(1, "At least one item is required")
      .max(999, "Cannot exceed 999 items")
      .optional(),
  });

// Schema for creating factura header only (without items)
export const saldosFacturaHeaderSchema = saldosFacturaBaseSchema.omit({
  facturau: true,
});

export const createBalanceInvoiceHeaderSchema = saldosFacturaHeaderSchema
  .refine(
    (data) => {
      // If credit (FGPago = CREDITO), must have at least one condition
      if (data.FGPago === "CREDITO") {
        return data.FGCondicion1 || data.FGCondicion2 || data.FGCondicion3;
      }
      return true;
    },
    {
      message: "At least one payment condition is required for credit facturas",
      path: ["FGCondicion1"],
    },
  )
  .refine(
    (data) => {
      // Due date must be after issue date
      if (data.FGFechaCreado && data.FGFechaVencimiento) {
        return data.FGFechaVencimiento >= data.FGFechaCreado;
      }
      return true;
    },
    {
      message: "Due date must be after issue date",
      path: ["FGFechaVencimiento"],
    },
  );

// Generate all TypeScript types from Zod schemas (single source of truth)
export type BalanceInvoiceItem = z.infer<typeof saldosFacturaItemSchema>;
export type UpdateBalanceInvoiceData = z.infer<
  typeof updateBalanceInvoiceSchema
>;
export type CreateBalanceInvoiceHeaderData = z.infer<
  typeof createBalanceInvoiceHeaderSchema
>;
