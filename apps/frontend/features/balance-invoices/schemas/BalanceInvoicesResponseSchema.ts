import { paginationMetaSchema } from "@/lib/api/types";
import { clientResponseSchema } from "@/features/clients/schemas/ClientSchema";
import { vendorResponseSchema } from "@/features/vendors/schemas/VendorSchema";
import { cityResponseSchema } from "@/features/geography/schemas/cities.schema";
import { fixedDateFromPrisma } from "@/lib/date";
import { z } from "zod";

/**
 * Parse a Prisma `@db.Date` field (date-only, serialized at UTC midnight) into a
 * local Date for the same calendar day, avoiding the off-by-one shift that
 * `new Date(...)` introduces in timezones behind UTC.
 */
const prismaDate = z
  .union([z.string(), z.date()])
  .transform((val) =>
    val instanceof Date ? fixedDateFromPrisma(val) : fixedDateFromPrisma(new Date(val)),
  );

export const estadoFacturaSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "PAID",
  "OVERDUE",
  "ANULATED",
]);

export const EstadoFactura = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  ANULATED: "ANULATED",
} as const;

export const tipoPagoSchema = z.enum([
  "CONTADO",
  "CANJE",
  "CREDITO",
  "WALLET",
  "CREDIT_CARD",
  "TRANSFER",
  "CHECK",
]);

const invcaruniRelationSchema = z
  .object({
    CKDescripcion: z.string().optional(),
    origenPais: z.object({ nombre: z.string() }).loose().optional(),
  })
  .loose()
  .optional();

export const balanceInvoiceItemResponseSchema = z
  .object({
    FUId: z.number().int().positive(),
    FUInvcaruniId: z.number().int().positive(),
    FUCantidad: z.number(),
    FUVrUnitario: z.union([z.number(), z.string()]).transform(Number),
    FUVrBruto: z.union([z.number(), z.string()]).transform(Number).optional(),
    FUDescuento: z.union([z.number(), z.string()]).transform(Number).optional(),
    FUDetalle: z.string().optional(),
    invcaruni: invcaruniRelationSchema,
  })
  .loose();

export const balanceInvoiceResponseSchema = z
  .object({
    FGId: z.number().int().positive(),
    FGOrgSecuencia: z.number().int().positive(),
    FGNro: z.number().int(),
    FGEstado: estadoFacturaSchema,
    FGVendedorId: z.number().int().positive(),
    FGClienteId: z.number().int().positive(),
    FGPurchaseOrder: z.string().nullable().optional(),
    FGPago: tipoPagoSchema,
    FGValorTotalNeto: z.union([z.number(), z.string()]).transform(Number).optional(),
    FGValorTotalBruto: z.union([z.number(), z.string()]).transform(Number).optional(),
    FGSaldo: z.union([z.number(), z.string()]).transform(Number).optional(),
    FGCondicion1: z.string().nullable().optional(),
    FGCondicion2: z.string().nullable().optional(),
    FGCondicion3: z.string().nullable().optional(),
    FGTelefono1: z.string(),
    FGTelefono2: z.string().nullable().optional(),
    FGCorreo1: z.string(),
    FGCorreo2: z.string().nullable().optional(),
    FGDireccionEntrega: z.string().optional(),
    FGCiudadId: z.number().int().positive(),
    FGFechaCreado: prismaDate,
    FGFechaVencimiento: prismaDate,
    // Full timestamp (not @db.Date), so no calendar-day normalization needed.
    FGFechaPago: z.union([z.string(), z.date()]).nullable().optional(),
    FGFacturaDeSaldo: z.boolean().optional(),
    facturau: z.array(balanceInvoiceItemResponseSchema).default([]),
    cltemae: clientResponseSchema,
    vendedor: vendorResponseSchema.optional().nullable(),
    ciudad: cityResponseSchema.optional().nullable(),
    movCXC: z.array(z.unknown()).optional(),
  })
  .loose();

export const balanceInvoiceListResponseSchema = z.object({
  data: z.array(balanceInvoiceResponseSchema),
  pagination: paginationMetaSchema,
});

export const balanceInvoiceNextNumberResponseSchema = z.object({
  siguienteNumero: z.number(),
});

export type EstadoFacturaValue = z.infer<typeof estadoFacturaSchema>;
export type TipoPago = z.infer<typeof tipoPagoSchema>;
export type ServerBalanceInvoicesItem = z.infer<typeof balanceInvoiceItemResponseSchema>;
export type Factura = z.infer<typeof balanceInvoiceResponseSchema>;
export type ServerFactura = Factura;
export type ServerFacturasResponse = z.infer<typeof balanceInvoiceListResponseSchema>;
export type ServerNextNumberResponse = z.infer<typeof balanceInvoiceNextNumberResponseSchema>;
export type ServerCreateFacturaResponse = { factura: ServerFactura };
export type ServerUpdateFacturaResponse = ServerFactura;
export type ServerEmitFacturaResponse = ServerFactura;
