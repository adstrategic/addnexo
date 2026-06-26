import { z } from "zod";

/**
 * Payment type — kept in lockstep with the backend Prisma `TipoPago` enum
 * (packages/db schema) and the server-side `crearFacturaSchema`. The frontend
 * does not depend on `@repo/db`, so the values are mirrored here and reused as
 * the single source of truth for the dispatch-order → invoice conversion.
 */
export const tipoPagoSchema = z.enum([
  "CONTADO",
  "CANJE",
  "CREDITO",
  "WALLET",
  "CREDIT_CARD",
  "TRANSFER",
  "CHECK",
]);

export type TipoPago = z.infer<typeof tipoPagoSchema>;

/** Human-readable labels for each payment type. */
export const TIPO_PAGO_LABELS: Record<TipoPago, string> = {
  CONTADO: "Cash",
  CANJE: "Exchange",
  CREDITO: "Credit",
  WALLET: "Digital Wallet",
  CREDIT_CARD: "Credit Card",
  TRANSFER: "Bank Transfer",
  CHECK: "Check",
};

/**
 * Request body for converting a dispatched order into an invoice.
 * Mirrors the backend `crearFacturaSchema` (POST /invoices) exactly.
 */
export const convertDispatchOrderToInvoiceSchema = z.object({
  dispatchOrderId: z.number().int().positive(),
  diasParaVencimiento: z.number().int().min(1).max(365),
  pago: tipoPagoSchema,
});

export type ConvertDispatchOrderToInvoiceData = z.infer<
  typeof convertDispatchOrderToInvoiceSchema
>;

/**
 * Minimal view of the created invoice returned by the conversion endpoint.
 * Parsed loosely so additional FacturaG fields don't break the response.
 */
export const convertedInvoiceResponseSchema = z
  .object({
    FGOrgSecuencia: z.number().int(),
    FGNro: z.number().int(),
  })
  .loose();

export type ConvertedInvoiceResponse = z.infer<
  typeof convertedInvoiceResponseSchema
>;
