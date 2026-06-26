import { bankResponseSchema } from "@/features/banks/schemas/BankSchema";
import { clientResponseSchema } from "@/features/clients/schemas/ClientSchema";
import { cityResponseSchema } from "@/features/geography";
import { TipoPropositoMovkar } from "@/features/movement-types";
import { vendorResponseSchema } from "@/features/vendors/schemas/VendorSchema";
import { fixedDateFromPrisma } from "@/lib/date";
import { z } from "zod";

/**
 * Parse a Prisma `@db.Date` field (date-only, serialized at UTC midnight) into a
 * local Date for the same calendar day, avoiding the off-by-one shift that
 * `new Date(...)` introduces in timezones behind UTC.
 */
const prismaDate = z
  .string()
  .transform((val) => fixedDateFromPrisma(new Date(val)));

/** Invoice lifecycle status (Prisma `EstadoFactura`). */
export const estadoInvoiceSchema = z.enum([
  "ACTIVE",
  "PAID",
  "OVERDUE",
  "ANULATED",
]);

/** Payment type (Prisma `TipoPago`). */
export const tipoPagoSchema = z.enum([
  "CONTADO",
  "CANJE",
  "CREDITO",
  "WALLET",
  "CREDIT_CARD",
  "TRANSFER",
  "CHECK",
]);

/**
 * Invoice line item (Prisma `Facturau`, serialized).
 * Decimal columns arrive as numeric strings, so coerce to be safe.
 * `.loose()` lets nested relations (invcaruni, grupo, etc.) pass through.
 */
/** Product (Prisma `Invcaruni`) relation as read on a line item. */
const serverInvoiceItemProductSchema = z
  .object({
    CKDescripcion: z.string().nullish(),
    origenPais: z.object({ nombre: z.string().nullish() }).loose().nullish(),
  })
  .loose();

export const serverInvoiceItemSchema = z
  .object({
    FUId: z.number().int().positive(),
    FUInvcaruniId: z.number().int(),
    FUNro: z.number().int().optional(),
    FUCantidad: z.coerce.number(),
    FUDescuento: z.coerce.number(),
    FUVrNeto: z.coerce.number(),
    FUVrBruto: z.coerce.number(),
    FUVrUnitario: z.coerce.number(),
    FUDetalle: z.string().optional(),
    FUTieneImpuesto: z.boolean().optional(),
    FULote: z.string().optional(),
    FULoteNroDocumento: z.union([z.string(), z.number()]).nullish(),
    FUMovCXCId: z.number().int().nullish(),
    // Product relation (key matches the Prisma model: `invcaruni`).
    invcaruni: serverInvoiceItemProductSchema.nullish(),
  })
  .loose();

/** Wallet payment detail (Prisma `WalletPayment`, serialized). */
const serverWalletPaymentSchema = z
  .object({
    WPBancoId: z.number().int(),
    WPNombreWallet: z.string(),
    WPTelefonoOClave: z.string(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

/** Credit card payment detail (Prisma `CreditCardPayment`, serialized). */
const serverCreditCardPaymentSchema = z
  .object({
    CCPBancoId: z.number().int(),
    CCPMarca: z.string(),
    CCPUltimos4Digitos: z.string(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

/** Transfer payment detail (Prisma `TransferPayment`, serialized). */
const serverTransferPaymentSchema = z
  .object({
    TPBancoId: z.number().int(),
    TPTipoCuenta: z.string(),
    TPNumeroCuenta: z.string(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

/** Check payment detail (Prisma `CheckPayment`, serialized). */
const serverCheckPaymentSchema = z
  .object({
    CHPBancoId: z.number().int(),
    CHPNumeroCheque: z.string(),
    CHPFechaCheque: prismaDate.nullish(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

/** Movement type (Prisma `Tmovkar`) relation as read on a CXC movement. */
const serverMovCxcTipoMovimientoSchema = z
  .object({
    TProposito: z.enum(TipoPropositoMovkar).nullish(),
  })
  .loose();

/** CXC movement (Prisma `MovCXC`, serialized). */
export const serverMovCxcSchema = z
  .object({
    MCId: z.number().int().positive(),
    MCFacturaId: z.number().int(),
    MCNro: z.number().int().optional(),
    MCNroDocumento: z.string().optional(),
    MCDescripcion: z.string().optional(),
    MCValor: z.coerce.number(),
    MCTipoPago: tipoPagoSchema.optional(),
    MCFecha: prismaDate.optional(),
    MCSecuencia: z.number().int().optional(),
    // Relations
    tipoMovimiento: serverMovCxcTipoMovimientoSchema.nullish(),
    walletPayment: serverWalletPaymentSchema.nullish(),
    creditCardPayment: serverCreditCardPaymentSchema.nullish(),
    transferPayment: serverTransferPaymentSchema.nullish(),
    checkPayment: serverCheckPaymentSchema.nullish(),
  })
  .loose();

/**
 * Full invoice (Prisma `Facturag` + relations) as returned by
 * GET /invoices/:secuencia and the mov-cxc mutations.
 */
export const serverInvoiceSchema = z
  .object({
    FGId: z.number().int().positive(),
    FGOrganizationId: z.string(),
    FGVendedorId: z.number().int(),
    FGClienteId: z.number().int(),
    FGCiudadId: z.number().int(),
    FGNro: z.number().int(),
    FGOrgSecuencia: z.number().int(),
    FGPurchaseOrder: z.string().nullable().optional(),
    FGPago: tipoPagoSchema,
    FGValorTotalNeto: z.coerce.number(),
    FGValorTotalBruto: z.coerce.number(),
    FGTotalDescuento: z.coerce.number(),
    FGTotalIVA: z.coerce.number(),
    FGSaldo: z.coerce.number(),
    FGEstado: estadoInvoiceSchema,
    FGFacturaDeSaldo: z.boolean().optional(),
    FGFechaCreado: prismaDate,
    FGFechaVencimiento: prismaDate,
    // Full timestamp (not @db.Date), so no calendar-day normalization needed.
    FGFechaPago: z.string().nullable().optional(),
    // Delivery information
    FGDireccionEntrega: z.string().nullish(),
    FGTelefono1: z.string().nullish(),
    FGTelefono2: z.string().nullish(),
    FGCorreo1: z.string().nullish(),
    FGCorreo2: z.string().nullish(),
    // Credit payment conditions
    FGCondicion1: z.string().nullish(),
    FGCondicion2: z.string().nullish(),
    FGCondicion3: z.string().nullish(),
    // Line items (relation key matches the Prisma model: `facturau`).
    facturau: z.array(serverInvoiceItemSchema).optional(),
    // CXC movements (payments, debit/credit notes).
    movCXC: z.array(serverMovCxcSchema).optional(),
    cltemae: clientResponseSchema,
    vendedor: vendorResponseSchema,
    // TODO: analyze if really needed
    ciudad: cityResponseSchema.optional(),
  })
  .loose();

/** Pagination envelope used by every list endpoint. */
export const paginationSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  totalItems: z.number().int(),
  totalPages: z.number().int(),
});

/** GET /invoices — paginated list. */
export const serverInvoicesResponseSchema = z.object({
  data: z.array(serverInvoiceSchema),
  pagination: paginationSchema,
});

/** GET /invoices/statement/clients-with-outstanding. */
export const outstandingClientsResponseSchema = z.object({
  clienteIds: z.array(z.number()),
});

/** List query params. */
export const listInvoicesParamsSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  search: z.string().optional(),
  estado: estadoInvoiceSchema.optional(),
  clienteId: z.number().int().positive().optional(),
  vendedorId: z.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/**
 * Invoice status. Exposed as a value-and-type so existing call sites can use
 * both `EstadoInvoice.ACTIVE` (value) and `estado: EstadoInvoice` (type).
 */
export const EstadoInvoice = {
  ACTIVE: "ACTIVE",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
  ANULATED: "ANULATED",
} as const;
export type EstadoInvoice = (typeof EstadoInvoice)[keyof typeof EstadoInvoice];

/** Payment type (Prisma `TipoPago`). Value-and-type for the same reason. */
export const TipoPago = {
  CONTADO: "CONTADO",
  CANJE: "CANJE",
  CREDITO: "CREDITO",
  WALLET: "WALLET",
  CREDIT_CARD: "CREDIT_CARD",
  TRANSFER: "TRANSFER",
  CHECK: "CHECK",
} as const;
export type TipoPago = (typeof TipoPago)[keyof typeof TipoPago];

export type ServerInvoice = z.infer<typeof serverInvoiceSchema>;
export type ServerInvoiceItem = z.infer<typeof serverInvoiceItemSchema>;
export type ServerMovCXC = z.infer<typeof serverMovCxcSchema>;
export type ServerInvoicesResponse = z.infer<
  typeof serverInvoicesResponseSchema
>;
export type ListInvoicesParams = z.infer<typeof listInvoicesParamsSchema>;

// Mutations that return a full invoice share the same response shape.
export type ServerCreateInvoiceResponse = ServerInvoice;
