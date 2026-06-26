"use client";

import { useCallback } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { usePeriod } from "@/lib/context/period-context";
import type {
  InventoryDashboardQuery,
  InventoryDashboardResponse,
  ProductSummary,
} from "@/features/inventory";

import type {
  KardexLot,
  KardexMovement,
  KardexMovementsQuery,
  KardexProduct,
  KardexTransaction,
} from "../schemas/KardexSchemas";
import { kardexService } from "../services/KardexServices";

export const kardexKeys = {
  all: ["kardex-dashboard"] as const,
  products: (params: object) => [...kardexKeys.all, "products", params] as const,
  lots: (params: object) => [...kardexKeys.all, "lots", params] as const,
  movements: (params: object) =>
    [...kardexKeys.all, "movements", params] as const,
};

export const mapSummaryToKardexProduct = (
  summary: ProductSummary,
): KardexProduct => ({
  id: summary.id,
  invcaruniId: summary.invcaruniId,
  group: summary.group,
  code: summary.code,
  name: summary.product,
  unit: summary.unit,
  country: summary.country,
  salesPrice: 0,
  invIni: summary.invIni,
  inputs: summary.inputs,
  inputsUSD: summary.inputsUSD,
  outputs: summary.outputs,
  outputsUSD: summary.outputsUSD,
  invEnd: summary.invEnd,
  avgCost: summary.avgCost,
  lastCost: summary.lastCost,
  stockValue: summary.stockValue,
  totalValueLastCost: summary.totalValueLastCost,
  minStock: summary.minStock,
});

const mapRowsToLots = (dashboard: InventoryDashboardResponse): KardexLot[] =>
  dashboard.rows.map((row) => {
    const [lote, ...docParts] = (row.lot || "-").split("-");
    return {
      id: row.id,
      origen: row.countryOfOrigin || "-",
      lote: lote || "-",
      documento: docParts.join("-") || "-",
      productId: `${row.code}|${row.product}`,
      productName: row.product || "-",
      invIni: row.invIni,
      inputs: row.inputs,
      outputs: row.outputs,
      invEnd: row.stock,
    };
  });

const mapMovementsToTransactions = (
  movimientos: KardexMovement[],
): KardexTransaction[] =>
  movimientos.map((mov) => ({
    id: String(mov.MVId),
    type: mov.dashboardType === 1 ? 1 : mov.dashboardType === 2 ? 2 : 3,
    transac: mov.tmovkar.TDescripcion,
    typeLabel: mov.dashboardType === 1 ? ("Entry" as const) : ("Exit" as const),
    lote: mov.MVLote,
    documentNumber:
      mov.MVLoteNroDocumento || mov.dashboardPurchaseOrInvoiceRef || "-",
    date: new Date(mov.MVFecha).toISOString().slice(0, 10),
    productId: `${mov.invcaruni.CKCodigo}|${mov.invcaruni.CKDescripcion}`,
    productDescription: mov.invcaruni.CKDescripcion || "-",
    csmSppl: mov.dashboardPartner,
    costPrice:
      mov.dashboardType === 1
        ? (mov.MVCostoUltimo ?? mov.dashboardLastCost ?? 0)
        : (mov.MVCostoSalida ?? mov.dashboardLastCost ?? 0),
    salePrice: mov.MVCostoPrecio ?? mov.dashboardSalePrice ?? 0,
    quantity: mov.MVCantidad,
    isPendingCostZero: Boolean(
      mov.MVEsCostoTemporalCero && mov.dashboardType === 1,
    ),
  }));

const STALE_TIME = 30 * 1000;

/**
 * Product-table slice of the dashboard. `mes`/`ano` are in the key (not the
 * request) so switching periods refetches; the backend resolves the period
 * from the session.
 */
export function useKardexProducts(query: InventoryDashboardQuery) {
  const { mes, ano, loading: periodLoading } = usePeriod();

  return useQuery({
    queryKey: kardexKeys.products({ ...query, mes, ano }),
    queryFn: () => kardexService.getDashboard(query),
    select: useCallback(
      (data: InventoryDashboardResponse) => ({
        products: data.productSummaries.map(mapSummaryToKardexProduct),
        summaries: data.productSummaries,
        totals: data.productSummariesTotals,
        pagination: data.pagination.products,
      }),
      [],
    ),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
    enabled: !periodLoading,
  });
}

/** Lot-table slice of the dashboard (independent pagination + search). */
export function useKardexLots(query: InventoryDashboardQuery) {
  const { mes, ano, loading: periodLoading } = usePeriod();

  return useQuery({
    queryKey: kardexKeys.lots({ ...query, mes, ano }),
    queryFn: () => kardexService.getDashboard(query),
    select: useCallback(
      (data: InventoryDashboardResponse) => ({
        lots: mapRowsToLots(data),
        pagination: data.pagination.lots,
      }),
      [],
    ),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
    enabled: !periodLoading,
  });
}

/** Transaction log from GET /movements (not period-scoped server-side). */
export function useKardexMovements(query: KardexMovementsQuery) {
  return useQuery({
    queryKey: kardexKeys.movements(query),
    queryFn: () => kardexService.listMovements(query),
    select: useCallback(
      (data: { data: KardexMovement[]; pagination: { page: number; limit: number; totalItems: number; totalPages: number } }) => ({
        transactions: mapMovementsToTransactions(data.data),
        pagination: data.pagination,
      }),
      [],
    ),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}
