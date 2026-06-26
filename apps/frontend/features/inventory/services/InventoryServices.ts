import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";

import type {
  InventoryDashboardQuery,
  InventoryDashboardResponse,
} from "../schemas/InventorySchemas";
import { inventoryDashboardResponseSchema } from "../schemas/InventorySchemas";

const BASE_URL = "/dashboard/inventory";

async function getDashboard(
  query: InventoryDashboardQuery,
): Promise<InventoryDashboardResponse> {
  try {
    const { data } = await apiClient.get<InventoryDashboardResponse>(
      BASE_URL,
      {
        params: {
          dateRange: query.dateRange,
          country: query.country,
          product: query.product,
          invcaruniId: query.invcaruniId ?? undefined,
          group: query.group,
          search: query.search?.trim() || undefined,
          productPage: query.productPage,
          productLimit: query.productLimit,
          lotPage: query.lotPage,
          lotLimit: query.lotLimit,
          lotSearch: query.lotSearch?.trim() || undefined,
        },
      },
    );
    return inventoryDashboardResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const inventoryService = {
  getDashboard,
};
