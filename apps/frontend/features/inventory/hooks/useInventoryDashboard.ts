"use client";

import { useQuery } from "@tanstack/react-query";

import { usePeriod } from "@/lib/context/period-context";

import type { InventoryDashboardQuery } from "../schemas/InventorySchemas";
import { inventoryService } from "../services/InventoryServices";

export const inventoryDashboardKeys = {
  all: ["inventory-dashboard"] as const,
  dashboard: (params: InventoryDashboardQuery & { mes: number; ano: number }) =>
    [...inventoryDashboardKeys.all, params] as const,
};

/**
 * Inventory dashboard query. The backend resolves the active period from the
 * session, but `mes`/`ano` are part of the query key so switching periods
 * refetches instead of serving stale cache.
 */
export function useInventoryDashboard(params: InventoryDashboardQuery) {
  const { mes, ano, loading: periodLoading } = usePeriod();

  return useQuery({
    queryKey: inventoryDashboardKeys.dashboard({ ...params, mes, ano }),
    queryFn: () => inventoryService.getDashboard(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled: !periodLoading,
  });
}
