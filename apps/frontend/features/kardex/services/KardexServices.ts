import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import { inventoryService } from "@/features/inventory";

import type {
  KardexMovementsQuery,
  KardexMovementsResponse,
} from "../schemas/KardexSchemas";
import { kardexMovementsResponseSchema } from "../schemas/KardexSchemas";

const MOVEMENTS_URL = "/movements";

async function listMovements(
  query: KardexMovementsQuery,
): Promise<KardexMovementsResponse> {
  try {
    const { data } = await apiClient.get<KardexMovementsResponse>(
      MOVEMENTS_URL,
      {
        params: {
          page: query.page,
          limit: query.limit,
          search: query.search?.trim() || undefined,
          kardexLoteId: query.kardexLoteId,
          invcaruniId: query.invcaruniId,
          group: query.group !== "All" ? query.group : undefined,
          country: query.country !== "All" ? query.country : undefined,
        },
      },
    );
    return kardexMovementsResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const kardexService = {
  /** The kardex dashboard reads the same endpoint as the inventory dashboard. */
  getDashboard: inventoryService.getDashboard,
  listMovements,
};
