import { z } from "zod";

import { paginationMetaSchema } from "@/lib/api/types";

/** Product row of the kardex dashboard (mapped from dashboard productSummaries). */
export interface KardexProduct {
  id: string;
  invcaruniId: number;
  group: string;
  code: string;
  name: string;
  unit: string;
  country: string;
  salesPrice: number;
  invIni: number;
  inputs: number;
  inputsUSD: number;
  outputs: number;
  outputsUSD: number;
  invEnd: number;
  avgCost: number;
  lastCost: number;
  stockValue: number;
  totalValueLastCost: number;
  minStock: number;
}

/** Lot row of the kardex dashboard (mapped from dashboard lot rows). */
export interface KardexLot {
  id: string;
  origen: string;
  lote: string;
  documento: string;
  productId: string;
  productName: string;
  invIni: number;
  inputs: number;
  outputs: number;
  invEnd: number;
}

export type TransactionClass = 1 | 2 | 3;

/** Movement row of the transaction log (mapped from GET /movements). */
export interface KardexTransaction {
  id: string;
  type: TransactionClass;
  transac: string;
  typeLabel?: "Entry" | "Exit";
  lote?: string;
  documentNumber?: string;
  date: string;
  productId: string;
  productDescription: string;
  csmSppl: string;
  costPrice?: number;
  salePrice?: number;
  quantity: number;
  isPendingCostZero?: boolean;
}

export interface KardexProductTotals {
  invIni: number;
  inputs: number;
  inputsUSD: number;
  outputs: number;
  outputsUSD: number;
  invEnd: number;
  stockValue: number;
  totalValueLastCost: number;
}

export interface KardexTableServerPagination {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

/**
 * Movement item as returned by GET /movements — only the fields the
 * transaction log consumes. Decimal columns arrive as strings, hence the
 * coercion.
 */
export const kardexMovementSchema = z.object({
  MVId: z.number(),
  MVFecha: z.string(),
  MVLote: z.string(),
  MVLoteNroDocumento: z.string().nullish(),
  MVCantidad: z.coerce.number(),
  MVCostoSalida: z.coerce.number().nullish(),
  MVCostoUltimo: z.coerce.number(),
  MVCostoPrecio: z.coerce.number().nullish(),
  MVEsCostoTemporalCero: z.boolean().optional(),
  tmovkar: z.object({
    TDescripcion: z.string(),
    TTipo: z.number(),
  }),
  invcaruni: z.object({
    CKCodigo: z.number(),
    CKDescripcion: z.string(),
  }),
  dashboardType: z.number(),
  dashboardPartner: z.string(),
  dashboardPurchaseOrInvoiceRef: z.string(),
  dashboardLastCost: z.coerce.number(),
  dashboardSalePrice: z.coerce.number(),
});

export const kardexMovementsResponseSchema = z.object({
  data: z.array(kardexMovementSchema),
  pagination: paginationMetaSchema,
});

export type KardexMovement = z.infer<typeof kardexMovementSchema>;
export type KardexMovementsResponse = z.infer<
  typeof kardexMovementsResponseSchema
>;

export interface KardexMovementsQuery {
  page?: number;
  limit?: number;
  search?: string;
  kardexLoteId?: number;
  invcaruniId?: number;
  group?: string;
  country?: string;
}
