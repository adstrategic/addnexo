import { paginationMetaSchema } from "@/lib/api/types";
import { bankResponseSchema } from "@/features/banks/schemas/BankSchema";
import { clientResponseSchema } from "@/features/clients/schemas/ClientSchema";
import { cityResponseSchema } from "@/features/geography/schemas/cities.schema";
import {
  estadoInvoiceSchema,
  tipoPagoSchema,
} from "@/features/invoices/schemas/invoices-response.schema";
import { vendorResponseSchema } from "@/features/vendors/schemas/VendorSchema";
import { fixedDateFromPrisma } from "@/lib/date";
import { z } from "zod";

const nullableApiDate = z
  .union([z.string(), z.date(), z.null()])
  .optional()
  .nullable()
  .transform((val) => {
    if (val == null) return undefined;
    return val instanceof Date
      ? fixedDateFromPrisma(val)
      : fixedDateFromPrisma(new Date(val));
  });

const movCxcWalletPaymentSchema = z
  .object({
    WPNombreWallet: z.string(),
    WPTelefonoOClave: z.string(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

const movCxcCreditCardPaymentSchema = z
  .object({
    CCPMarca: z.string().optional(),
    CCPUltimos4Digitos: z.string().optional(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

const movCxcTransferPaymentSchema = z
  .object({
    TPTipoCuenta: z.string(),
    TPNumeroCuenta: z.string(),
    bank: bankResponseSchema.nullish(),
  })
  .loose();

const movCxcCheckPaymentSchema = z
  .object({
    CHPNumeroCheque: z.string(),
    CHPFechaCheque: nullableApiDate,
    bank: bankResponseSchema.nullish(),
  })
  .loose();

const movCxcTipoMovimientoSchema = z
  .object({
    TId: z.number().int().optional(),
    TProposito: z.string().optional(),
    TDescripcion: z.string().optional(),
  })
  .loose();

const movCxcNoteInvoiceSchema = z
  .object({
    FGId: z.number().int().positive(),
    FGNro: z.number().int(),
    FGOrgSecuencia: z.number().int().positive(),
    FGEstado: estadoInvoiceSchema,
    cltemae: clientResponseSchema,
    vendedor: vendorResponseSchema.nullish(),
    ciudad: cityResponseSchema.optional(),
  })
  .loose();

const movCxcReturnItemSchema = z
  .object({
    FUId: z.number().int().positive(),
    FUCantidad: z.coerce.number(),
    FUVrUnitario: z.coerce.number(),
    FUVrNeto: z.coerce.number(),
    FUDetalle: z.string().optional(),
    invcaruni: z
      .object({
        CKDescripcion: z.string().optional(),
        grupo: z.record(z.string(), z.unknown()).optional(),
        unidadDeMedida: z.record(z.string(), z.unknown()).optional(),
      })
      .loose()
      .optional(),
  })
  .loose();

/** MovCXC credit/debit note from list/detail APIs. */
export const movCxcNoteResponseSchema = z
  .object({
    MCId: z.number().int().positive(),
    MCSecuencia: z.number().int(),
    MCNro: z.number().int().optional(),
    MCNroDocumento: z.string(),
    MCDescripcion: z.string(),
    MCValor: z.coerce.number(),
    MCTipoPago: tipoPagoSchema,
    MCFecha: nullableApiDate,
    tipoMovimiento: movCxcTipoMovimientoSchema,
    facturag: movCxcNoteInvoiceSchema,
    walletPayment: movCxcWalletPaymentSchema.nullish(),
    creditCardPayment: movCxcCreditCardPaymentSchema.nullish(),
    transferPayment: movCxcTransferPaymentSchema.nullish(),
    checkPayment: movCxcCheckPaymentSchema.nullish(),
    facturaReturnItems: z.array(movCxcReturnItemSchema).optional(),
  })
  .loose();

const listPaginationSchema = paginationMetaSchema.extend({
  page: z.coerce.number(),
  limit: z.coerce.number(),
  totalItems: z.coerce.number(),
  totalPages: z.coerce.number(),
});

export const movCxcNoteListResponseSchema = z.object({
  data: z.array(movCxcNoteResponseSchema),
  pagination: listPaginationSchema,
});

export const listMovCxcNotesParamsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  estado: estadoInvoiceSchema.optional(),
});

export type MovCxcNoteResponse = z.infer<typeof movCxcNoteResponseSchema>;
export type MovCxcNoteListResponse = z.infer<typeof movCxcNoteListResponseSchema>;
export type ListMovCxcNotesParams = z.infer<typeof listMovCxcNotesParamsSchema>;
