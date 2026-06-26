import { z } from "zod";
import type { LucideIcon } from "lucide-react";

import { paginationMetaSchema } from "@/lib/api/types";

/** Shared filter contract for the inventory/kardex dashboards. */
export interface KardexDataFilters {
  country: string;
  product: string;
  invcaruniId: number | null;
  group: string;
}

export interface KPIMetric {
  title: string;
  value: number | string;
  /** Percentage change vs previous period */
  delta: number;
  unit?: string;
  tooltip: string;
  icon: LucideIcon;
}

export const inventoryLotRowSchema = z.object({
  id: z.string(),
  code: z.string(),
  product: z.string(),
  group: z.string(),
  lot: z.string(),
  invIni: z.number(),
  inputs: z.number(),
  outputs: z.number(),
  stock: z.number(),
  purchaseDate: z.string(),
  countryOfOrigin: z.string(),
  unitCostUSD: z.number(),
  totalValueUSD: z.number(),
  minStock: z.number(),
  dio: z.number(),
  measurementUnit: z.string().optional(),
});

export const inventoryKardexTableRowSchema = z.object({
  id: z.string(),
  code: z.string(),
  product: z.string(),
  group: z.string(),
  unit: z.string(),
  invEnd: z.number(),
  avgCost: z.number(),
  lastCost: z.number(),
  totalValueAvgCost: z.number(),
  totalValueLastCost: z.number(),
  minStock: z.number(),
});

export const productSummarySchema = z.object({
  id: z.string(),
  invcaruniId: z.number(),
  code: z.string(),
  product: z.string(),
  group: z.string(),
  unit: z.string(),
  country: z.string(),
  invIni: z.number(),
  inputs: z.number(),
  inputsUSD: z.number(),
  outputs: z.number(),
  outputsUSD: z.number(),
  invEnd: z.number(),
  entryUnitCost: z.number(),
  avgCost: z.number(),
  lastCost: z.number(),
  totalValueEntryCost: z.number(),
  stockValue: z.number(),
  totalValueLastCost: z.number(),
  minStock: z.number(),
});

export const productSummariesTotalsSchema = z.object({
  invIni: z.number(),
  inputs: z.number(),
  inputsUSD: z.number(),
  outputs: z.number(),
  outputsUSD: z.number(),
  invEnd: z.number(),
  stockValue: z.number(),
  totalValueLastCost: z.number(),
});

export const lotBreakdownTotalsSchema = z.object({
  invIni: z.number(),
  inputs: z.number(),
  outputs: z.number(),
  invEnd: z.number(),
});

export const originBreakdownItemSchema = z.object({
  country: z.string(),
  stock: z.number(),
  percentage: z.number(),
});

export const inventoryKpisSchema = z.object({
  stockUnits: z.number(),
  totalValueUsd: z.number(),
  avgCostUsd: z.number(),
  totalValueAtAvgCostUsd: z.number(),
  totalValueAtEntryCostUsd: z.number(),
  globalDio: z.number(),
  deltas: z.object({
    stockUnits: z.number(),
    totalValueUsd: z.number(),
    avgCostUsd: z.number(),
    totalValueAtAvgCostUsd: z.number(),
    totalValueAtEntryCostUsd: z.number(),
    globalDio: z.number(),
  }),
});

export const inventoryFilterOptionsSchema = z.object({
  countries: z.array(z.string()),
  products: z.array(z.string()),
  groups: z.array(z.string()),
});

export const inventoryDashboardResponseSchema = z.object({
  kpis: inventoryKpisSchema,
  rows: z.array(inventoryLotRowSchema),
  kardexTableRows: z.array(inventoryKardexTableRowSchema),
  productSummaries: z.array(productSummarySchema),
  productSummariesTotals: productSummariesTotalsSchema,
  lotBreakdownTotals: lotBreakdownTotalsSchema,
  originBreakdown: z.array(originBreakdownItemSchema),
  filterOptions: inventoryFilterOptionsSchema,
  pagination: z.object({
    products: paginationMetaSchema,
    lots: paginationMetaSchema,
  }),
});

export type InventoryLotRow = z.infer<typeof inventoryLotRowSchema>;
export type InventoryKardexTableRow = z.infer<
  typeof inventoryKardexTableRowSchema
>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductSummariesTotals = z.infer<
  typeof productSummariesTotalsSchema
>;
export type LotBreakdownTotals = z.infer<typeof lotBreakdownTotalsSchema>;
export type OriginBreakdownItem = z.infer<typeof originBreakdownItemSchema>;
export type InventoryFilterOptions = z.infer<
  typeof inventoryFilterOptionsSchema
>;
export type InventoryDashboardResponse = z.infer<
  typeof inventoryDashboardResponseSchema
>;

export interface InventoryDashboardQuery {
  dateRange?: "30d" | "60d" | "90d" | "6m" | "1y" | "Custom";
  country?: string;
  product?: string;
  invcaruniId?: number | null;
  group?: string;
  search?: string;
  productPage?: number;
  productLimit?: number;
  lotPage?: number;
  lotLimit?: number;
  lotSearch?: string;
}
