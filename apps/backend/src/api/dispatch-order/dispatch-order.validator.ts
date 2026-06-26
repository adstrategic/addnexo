import { z } from "zod";

import { nullableOptional } from "../../lib/utils.js";

// ===== ESQUEMAS DE VALIDACIÓN (para middleware) =====

export const dispatchOrderItemSchema = z.object({
  DOUInvcaruniId: z
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

  // Optional lot number and document number for manual selection
  DOULote: nullableOptional(z.string().trim().max(100)),
  DOUNroDocumento: nullableOptional(z.string().min(1)),
});

// Esquema para listado de dispatch orders
export const listDispatchOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  estado: z
    .enum(["DRAFT", "EMITTED", "DISPATCHED", "INVOICED", "ANULATED"])
    .optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  vendedorId: z.coerce.number().int().positive().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

// Esquema para obtener dispatch order por ID
export const getDispatchOrderByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Esquema para obtener dispatch order por secuencia
export const getDispatchOrderBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Esquema para obtener item por ID
export const getDispatchOrderItemByIdSchema = z.object({
  itemId: z.coerce
    .number()
    .int()
    .positive("The item ID must be a positive number"),
});

// Base schema for dispatch orders (without refinements)
const baseDispatchOrderSchema = z.object({
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

  // Payment conditions (required if DOGPago = CREDITO)
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
  DOGPurchaseOrder: z.string().nullish(),
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
  DOGFechaCreado: z.coerce.date({ error: "Issue date is required" }),
  // DOGModoSalida: z.enum(["MANUAL", "AUTOMATICO"]),
  // Server expects 'dispatchOrderU' array in request
  dispatchOrderU: z
    .array(dispatchOrderItemSchema)
    .min(1, "At least one item is required")
    .max(999, "Cannot exceed 999 dispatchOrderU"),
});

// Esquema para la actualización de dispatch order (solo DRAFT)
export const actualizarDispatchOrderSchema = baseDispatchOrderSchema
  .partial()
  .omit({
    dispatchOrderU: true,
  });

// Esquema para emitir dispatch order (cambiar estado a EMITTED)
export const emitirDispatchOrderSchema = baseDispatchOrderSchema
  .partial()
  .extend({
    dispatchOrderU: z
      .array(dispatchOrderItemSchema)
      .min(1, "At least one item is required")
      .max(999, "Cannot exceed 999 items")
      .optional(),
  });

// ===== NUEVOS ESQUEMAS PARA PERSISTENCIA EN TIEMPO REAL =====

// Esquema para crear solo el header (sin items)
export const crearDispatchOrderHeaderSchema = baseDispatchOrderSchema.omit({
  dispatchOrderU: true,
});

// Esquema para agregar un item
export const agregarDispatchOrderItemSchema = z.object({
  DOUInvcaruniId: z
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
    .nonnegative("Unit price cannot be negative")
    .max(9999999.99, "Unit price cannot exceed 9999999.99"),
  DOUDescuento: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),
  DOUTieneImpuesto: z.boolean(),
  DOULote: nullableOptional(z.string().trim().max(100)),
  DOUNroDocumento: nullableOptional(z.string().min(1)),
  DOUModoSalida: z.enum(["MANUAL", "AUTOMATICO"]),
  DOUReservar: z.boolean().optional().default(false),
});

// Esquema para actualizar un item completo (todos los campos opcionales)
export const actualizarDispatchOrderItemSchema = z
  .object({
    DOUCantidad: z
      .number()
      .positive("Quantity must be greater than 0")
      .max(999999, "Quantity cannot exceed 999999")
      .optional(),
    DOUVrUnitario: z
      .number()
      .nonnegative("Unit price cannot be negative")
      .max(9999999.99, "Unit price cannot exceed 9999999.99")
      .optional(),
    DOUDescuento: z
      .number()
      .min(0, "Discount cannot be negative")
      .max(100, "Discount cannot exceed 100%")
      .optional(),
    DOUTieneImpuesto: z.boolean().optional(),
    DOUDetalle: z.string().optional(),
    DOUReservar: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Al menos un campo debe estar presente
      return (
        data.DOUCantidad !== undefined ||
        data.DOUVrUnitario !== undefined ||
        data.DOUDescuento !== undefined ||
        data.DOUTieneImpuesto !== undefined ||
        data.DOUDetalle !== undefined ||
        data.DOUReservar !== undefined
      );
    },
    {
      message: "At least one field must be provided for update",
    },
  );

// Esquema para actualizar cantidad devuelta (temporal para tiempo real)
export const actualizarCantidadDevueltaSchema = z.object({
  DOUCantidadDevuelta: z
    .number()
    .int()
    .min(0, "Returned quantity cannot be negative")
    .max(999999, "Returned quantity cannot exceed 999999"),
});

// Esquema para obtener items disponibles para devolución
export const getItemsDisponiblesDevolucionSchema =
  getDispatchOrderBySecuenciaSchema;

// Esquema para crear devoluciones
export const crearDevolucionesSchema = z.object({
  devoluciones: z
    .array(
      z.object({
        DOUId: z.number().int().positive("Item ID is required"),
        DOUCantidad: z
          .number()
          .int()
          .positive("Quantity must be greater than 0")
          .max(999999, "Quantity cannot exceed 999999"),
      }),
    )
    .min(1, "At least one return item is required"),
});

// Esquema para anular dispatch order
export const anularDispatchOrderSchema = z.object({
  razonAnulacion: z.string().optional(), // Optional reason for audit trail
});

// Tipos para usar en el resto de la aplicación
export type ActualizarDispatchOrderDto = z.infer<
  typeof actualizarDispatchOrderSchema
>;
export type EmitirDispatchOrderDto = z.infer<typeof emitirDispatchOrderSchema>;
export type DispatchOrderItemDto = z.infer<typeof dispatchOrderItemSchema>;
export type ListDispatchOrdersQuery = z.infer<typeof listDispatchOrdersSchema>;
export type CrearDispatchOrderHeaderDto = z.infer<
  typeof crearDispatchOrderHeaderSchema
>;
export type AgregarDispatchOrderItemDto = z.infer<
  typeof agregarDispatchOrderItemSchema
>;
export type ActualizarDispatchOrderItemDto = z.infer<
  typeof actualizarDispatchOrderItemSchema
>;
export type ActualizarCantidadDevueltaDto = z.infer<
  typeof actualizarCantidadDevueltaSchema
>;
export type CrearDevolucionesDto = z.infer<typeof crearDevolucionesSchema>;
export type GetItemsDisponiblesDevolucionQuery = z.infer<
  typeof getItemsDisponiblesDevolucionSchema
>;
export type AnularDispatchOrderDto = z.infer<typeof anularDispatchOrderSchema>;

// ===== TYPES FOR WARNINGS =====

export interface FieldWarning {
  field: string;
  message: string;
  type: "discount_high" | "price_below_cost";
}

export interface UpdateItemResponse {
  items: DispatchOrderItemDto[];
  warnings?: FieldWarning[];
}
