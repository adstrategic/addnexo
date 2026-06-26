import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateAlmacenDto,
  UpdateAlmacenDto,
  ListAlmacenesParams,
  AlmacenResponse,
  AlmacenResponseList,
} from "../schemas/almacenes.schema";
import {
  almacenResponseSchema,
  almacenResponseListSchema,
} from "../schemas/almacenes.schema";

const BASE_URL = "/warehouses";

/**
 * Almacenes (Warehouses) service.
 * Handles all API calls for the warehouses feature.
 */
async function listAlmacenes(
  params?: ListAlmacenesParams,
): Promise<AlmacenResponseList> {
  try {
    const { data } = await apiClient.get<AlmacenResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });
    const validated = almacenResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    handleApiError(error);
  }
}

async function getAlmacenBySequence(
  sequence: number,
): Promise<AlmacenResponse> {
  try {
    const { data } = await apiClient.get<AlmacenResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return almacenResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createAlmacen(dto: CreateAlmacenDto): Promise<AlmacenResponse> {
  try {
    const { data } = await apiClient.post<AlmacenResponse>(BASE_URL, dto);
    return almacenResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateAlmacen(
  id: number,
  dto: UpdateAlmacenDto,
): Promise<AlmacenResponse> {
  try {
    const { data } = await apiClient.put<AlmacenResponse>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return almacenResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteAlmacen(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const almacenesService = {
  list: listAlmacenes,
  getBySequence: getAlmacenBySequence,
  create: createAlmacen,
  update: updateAlmacen,
  delete: deleteAlmacen,
};
