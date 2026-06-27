"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { BillingDashboardQuery } from "../schemas/BillingSchemas";
import { billingService } from "../services/BillingServices";

export const billingDashboardKeys = {
  all: ["billing-dashboard"] as const,
  dashboard: (params: BillingDashboardQuery) =>
    [...billingDashboardKeys.all, params] as const,
};

/**
 * Billing dashboard query. Not period-scoped server-side (invoices span
 * months); date filtering is done via the dateFrom/dateTo params.
 */
export function useBillingDashboard(params: BillingDashboardQuery) {
  return useQuery({
    queryKey: billingDashboardKeys.dashboard(params),
    queryFn: () => billingService.getDashboard(params),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}
