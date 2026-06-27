import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";

import type {
  BillingDashboardQuery,
  BillingDashboardResponse,
} from "../schemas/BillingSchemas";
import { billingDashboardResponseSchema } from "../schemas/BillingSchemas";

const BASE_URL = "/dashboard/billing";

async function getDashboard(
  query: BillingDashboardQuery,
): Promise<BillingDashboardResponse> {
  try {
    const { data } = await apiClient.get<BillingDashboardResponse>(BASE_URL, {
      params: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search?.trim() || undefined,
        status: query.status,
        clientId: query.clientId,
        vendorId: query.vendorId,
        dateFrom: query.dateFrom || undefined,
        dateTo: query.dateTo || undefined,
      },
    });
    return billingDashboardResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const billingService = {
  getDashboard,
};
