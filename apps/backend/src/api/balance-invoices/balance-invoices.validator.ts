import { EstadoFactura, TipoPago } from "@repo/db";
import { z } from "zod";
import { nullableOptional } from "../../lib/utils.js";

// ===== ESQUEMAS DE VALIDACIÓN (para middleware) =====

// Esquema para listado de facturas
export const listSaldosFacturasSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  estado: z.enum(EstadoFactura).optional(),
  clienteId: z.coerce.number().int().positive().optional(),
  vendedorId: z.coerce.number().int().positive().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

// Esquema para obtener factura por ID
export const getFacturaByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// Esquema para obtener factura por secuencia
export const getFacturaBySecuenciaSchema = z.object({
  secuencia: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Esquema para obtener item por ID
export const getFacturaItemByIdSchema = z.object({
  itemId: z.coerce
    .number()
    .int()
    .positive("The item ID must be a positive number"),
});

// Items schema
export const saldosFacturaItemSchema = z.object({
  FUInvcaruniId: z
    .number({
      error: "Product is required",
    })
    .int()
    .positive("Product is required"),
  FUCantidad: z
    .number({
      error: "Quantity is required",
    })
    .positive("Quantity must be greater than 0")
    .max(999999, "Quantity cannot exceed 999999"),
  FUVrUnitario: z
    .number({
      error: "Unit price is required",
    })
    .nonnegative("Unit price cannot be negative")
    .max(9999999.99, "Unit price cannot exceed 9999999.99"),
  FUDescuento: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%")
    .default(0),
  FUTieneImpuesto: z.boolean(),

  // Optional lot number for manual selection
  FULote: nullableOptional(z.coerce.number().int().positive()),
});

// Base schema for facturas (without refinements)
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

  // Payment type (CONTADO, CANJE, CREDITO)
  FGPago: z.enum(TipoPago, {
    error: "Payment type is required ",
  }),
  FGValorTotal: z.number().positive("Total value must be greater than 0"),
  FGNro: z.coerce.number().int().positive("Nro must be a positive number"),
  // Payment conditions (required if DOGPago = CREDITO)
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
  FGPurchaseOrder: z.string().nullish(),
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
  FGFechaCreado: z.coerce.date({ error: "Issue date is required" }),
  FGFechaVencimiento: z.coerce.date({ error: "Due date is required" }),
  // DOGModoSalida: z.enum(["MANUAL", "AUTOMATICO"]),
  // Server expects 'dispatchOrderU' array in request
  facturau: z
    .array(saldosFacturaItemSchema)
    .min(1, "At least one item is required")
    .max(999, "Cannot exceed 999 items"),
});

// Esquema para la creación de factura (DRAFT) - with refinement
export const crearSaldosFacturaSchema = saldosFacturaBaseSchema
  .refine(
    (data) => {
      // Si es crédito (FGPago = CREDITO), debe tener al menos una condición
      if (data.FGPago === "CREDITO") {
        return data.FGCondicion1 ?? data.FGCondicion2 ?? data.FGCondicion3;
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
      return data.FGFechaVencimiento >= data.FGFechaCreado;
    },
    {
      message: "Due date must be after issue date",
      path: ["FGFechaVencimiento"],
    },
  );
// Esquema para la actualización de factura (solo DRAFT)
export const actualizarSaldosFacturaSchema = saldosFacturaBaseSchema
  .partial()
  .omit({
    facturau: true,
  });

// ===== NUEVOS ESQUEMAS PARA PERSISTENCIA EN TIEMPO REAL =====

// Esquema para crear solo el header (sin items)
export const crearSaldosFacturaHeaderSchema = saldosFacturaBaseSchema.omit({
  facturau: true,
});

// Esquema para agregar un item
// Nota: Para facturas manuales, la cantidad siempre es 1 (no se envía en el request)
// TODO: Agregar validación de grupo 999 cuando se implemente
export const agregarSaldosFacturaItemSchema = z.object({
  FUInvcaruniId: z
    .number({
      error: "Product is required",
    })
    .int()
    .positive("Product is required"),
  FUVrUnitario: z
    .number({
      error: "Unit price is required",
    })
    .positive("Unit price cannot be negative")
    .max(9999999.99, "Unit price cannot exceed 9999999.99"),
  // TODO: Agregar validación para asegurar que el producto pertenezca al grupo 999
  // .refine(async (data) => {
  //   const producto = await prisma.invcaruni.findUnique({
  //     where: { CKId: data.FUInvcaruniId },
  //     include: { grupo: true },
  //   });
  //   return producto?.grupo.GNro === 999;
  // }, "Only products from group 999 are allowed for manual invoices")
});

// Esquema para actualizar un item completo (todos los campos opcionales)
export const actualizarSaldosFacturaItemSchema =
  agregarSaldosFacturaItemSchema.omit({
    FUInvcaruniId: true,
  });

// Esquema para obtener items disponibles para devolución
export const getItemsDisponiblesDevolucionSchema = getFacturaBySecuenciaSchema;

// Esquema para crear devoluciones
export const crearFacturaDevolucionesSchema = z.object({
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

// Tipos para usar en el resto de la aplicación
export type CrearSaldosFacturaDto = z.infer<typeof crearSaldosFacturaSchema>;
export type ActualizarSaldosFacturaDto = z.infer<
  typeof actualizarSaldosFacturaSchema
>;
export type SaldosFacturaItemDto = z.infer<typeof saldosFacturaItemSchema>;
export type ListSaldosFacturasQuery = z.infer<typeof listSaldosFacturasSchema>;
export type CrearSaldosFacturaHeaderDto = z.infer<
  typeof crearSaldosFacturaHeaderSchema
>;
export type AgregarSaldosFacturaItemDto = z.infer<
  typeof agregarSaldosFacturaItemSchema
>;
export type ActualizarSaldosFacturaItemDto = z.infer<
  typeof actualizarSaldosFacturaItemSchema
>;
