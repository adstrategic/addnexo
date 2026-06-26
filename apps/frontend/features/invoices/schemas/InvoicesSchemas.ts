import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

// Invoice item schema (matches server request DTO)
// For manual invoices: quantity is always 1, only group 999 items allowed
export const invoiceItemSchema = z.object({
  FUInvcaruniId: z.coerce
    .number({
      error: "Product is required",
    })
    .int()
    .positive("Product is required"),
  // Note: FUCantidad is always 1 for manual invoices, not sent in request
  FUVrUnitario: z.coerce
    .number({
      error: "Unit price is required",
    })
    .positive("Unit price must be greater than 0")
    .max(9999999.99, "Unit price cannot exceed 9999999.99"),
  // TODO: Add validation to ensure product belongs to group 999
});

// Base invoice schema (matches server request DTO)
const invoiceBaseSchema = z.object({
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

  // Payment type (matches Prisma TipoPago and PaymentForm)
  FGPago: z.enum([
    "CONTADO",
    "CANJE",
    "CREDITO",
    "WALLET",
    "CREDIT_CARD",
    "TRANSFER",
    "CHECK",
  ]),

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
  FGCorreo1: z.email("Email 1 must be a valid email"),

  FGCorreo2: nullableOptional(z.email("Email 2 must be a valid email")),
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
  // Server expects 'invoiceu' array in request
  facturau: z
    .array(invoiceItemSchema)
    .min(1, "At least one item is required")
    .max(999, "Cannot exceed 999 items"),
});

// Schema for creating invoice (DRAFT) - with refinements
export const createInvoiceSchema = invoiceBaseSchema.refine(
  (data) => {
    // If credit (FGPago = CREDITO), must have at least one condition
    if (data.FGPago === "CREDITO") {
      return data.FGCondicion1 || data.FGCondicion2 || data.FGCondicion3;
    }
    return true;
  },
  {
    message: "At least one payment condition is required for credit invoices",
    path: ["FGCondicion1"],
  },
);

// Schema for updating invoice (DRAFT only)
export const updateInvoiceSchema = invoiceBaseSchema.partial().extend({
  facturau: z
    .array(invoiceItemSchema)
    .min(1, "At least one item is required")
    .max(999, "Cannot exceed 999 items")
    .optional(),
});

// Schema for creating invoice header only (without items)
export const createInvoiceHeaderSchema = invoiceBaseSchema.omit({
  facturau: true,
});

export const updateInvoiceItemSchema = invoiceItemSchema.omit({
  FUInvcaruniId: true,
});

// Schema for form submission (header only, items are managed separately in real-time)
// This schema is used when the user clicks "Save Invoice" button
// Items are validated individually when added/updated via the items API
const invoiceHeaderOnlySchema = invoiceBaseSchema.omit({
  facturau: true,
});

export const submitInvoiceSchema = invoiceHeaderOnlySchema.refine(
  (data) => {
    // If credit (FGPago = CREDITO), must have at least one condition
    if (data.FGPago === "CREDITO") {
      return data.FGCondicion1 || data.FGCondicion2 || data.FGCondicion3;
    }
    return true;
  },
  {
    message: "At least one payment condition is required for credit invoices",
    path: ["FGCondicion1"],
  },
);

// Generate all TypeScript types from Zod schemas (single source of truth)
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>;
export type CreateInvoiceHeaderData = z.infer<typeof createInvoiceHeaderSchema>;
export type SubmitInvoiceData = z.infer<typeof submitInvoiceSchema>;
