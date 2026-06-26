import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

// Dispatch order item schema (matches server request DTO)
// DOUId is optional and used only as stable key for merging server data (not sent on create/update)
export const dispatchOrderItemSchema = z.object({
  DOUId: z.number().int().positive().optional(),
  DOUInvcaruniId: z.coerce
    .number({
      error: "Product is required",
    })
    .int()
    .positive("Product is required"),
  DOUCantidad: z
    .number({
      error: "Quantity is required",
    })
    .positive("Quantity must be greater than 0")
    .max(999999, "Quantity cannot exceed 999999"),
  DOUVrUnitario: z
    .number({
      error: "Unit price is required",
    })
    .positive("Unit price must be greater than 0")
    .max(9999999.99, "Unit price cannot exceed 9999999.99"),
  DOUDescuento: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),
  DOUTieneImpuesto: z.boolean(),
  // Optional fields for manual lot selection (composite key)
  DOULote: nullableOptional(z.number().int().positive()),
  DOUNroDocumento: nullableOptional(z.string().min(1)),
  // Optional field for reservation checkbox
  DOUReservar: z.boolean().optional().default(false),
});

// Base dispatch order schema (matches server request DTO)
export const dispatchOrderBaseSchema = z.object({
  // Vendor data (nullable)
  DOGVendedorId: z.coerce
    .number({ error: "Vendor ID is required" })
    .int()
    .positive("Vendor ID must be a positive number"),
  // Customer data
  DOGClienteId: z.coerce
    .number({ error: "Customer ID is required" })
    .int()
    .positive("Customer ID must be a positive number"),
  DOGPurchaseOrder: nullableOptional(
    z.string().max(50, "Purchase order must be 50 characters or less"),
  ),
  // Payment conditions (optional on dispatch order)
  DOGCondicion1: z
    .string()
    .max(40, "Condition must be 40 characters or less")
    .optional(),
  DOGCondicion2: z
    .string()
    .max(40, "Condition must be 40 characters or less")
    .optional(),
  DOGCondicion3: z
    .string()
    .max(40, "Condition must be 40 characters or less")
    .optional(),

  // Other header fields
  DOGTipo: z.number().int().default(1),
  DOGZona: z.number().int().default(0),
  DOGTelefono1: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  DOGTelefono2: nullableOptional(
    z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),
  ),
  DOGCorreo1: z.email("Email 1 must be a valid email"),

  DOGCorreo2: nullableOptional(z.email("Email 2 must be a valid email")),
  DOGDireccionEntrega: z
    .string()
    .max(100, "Delivery address must be 100 characters or less")
    .default(""),
  DOGCiudadId: z
    .number({
      error: "Delivery city is required",
    })
    .int()
    .positive("Please select a delivery city"),
  DOGFechaCreado: z.date({ error: "Issue date is required" }),
  // Server expects 'dispatchOrderU' array in request
  dispatchOrderU: z
    .array(dispatchOrderItemSchema)
    .min(1, "At least one item is required")
    .max(999, "Cannot exceed 999 dispatchOrderU"),
});

// Schema for creating dispatch order header only (without items)
export const dispatchOrderHeaderSchema = dispatchOrderBaseSchema.omit({
  dispatchOrderU: true,
});

export const createDispatchOrderHeaderSchema = dispatchOrderHeaderSchema;

// Schema for updating dispatch order header only (DRAFT only)
// Note: Items are updated separately via real-time API calls, not through form submit
export const updateDispatchOrderSchema = dispatchOrderHeaderSchema.partial();

/**
 * @deprecated Legacy schema - use createDispatchOrderHeaderSchema for header creation
 * and add items separately via the items API
 */
export const createDispatchOrderSchema = dispatchOrderBaseSchema;

// =============================================================================
// TYPE EXPORTS - Single source of truth from Zod schemas
// =============================================================================

/** Single dispatch order item (for item-level operations) */
export type DispatchOrderItem = z.infer<typeof dispatchOrderItemSchema>;

/** Data for creating dispatch order header only (Step 1 of creation flow) */
export type CreateDispatchOrderHeaderData = z.infer<
  typeof createDispatchOrderHeaderSchema
>;

/** Data for updating dispatch order header (items updated separately via real-time API) */
export type UpdateDispatchOrderData = z.infer<typeof updateDispatchOrderSchema>;

/** Header-only react-hook-form values */
export type DispatchOrderHeaderFormData = CreateDispatchOrderHeaderData;

/** Items-only react-hook-form (managed separately from header submit) */
export const dispatchOrderItemsFormSchema = z.object({
  dispatchOrderU: z.array(dispatchOrderItemSchema),
});

export type DispatchOrderItemsFormData = z.infer<
  typeof dispatchOrderItemsFormSchema
>;

/**
 * @deprecated Use DispatchOrderHeaderFormData for header fields
 * or DispatchOrderItemsFormData for the items table.
 */
export type DispatchOrderFormData = DispatchOrderHeaderFormData;

/**
 * @deprecated Legacy type - use CreateDispatchOrderHeaderData for header creation
 * and add items separately via the items API
 */
export type CreateDispatchOrderData = z.infer<typeof createDispatchOrderSchema>;
