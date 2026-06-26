import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateUnitDto,
  UpdateUnitDto,
  ListUnitsParams,
  UnitResponse,
  UnitResponseList,
} from "../schemas/units.schema";
import {
  unitResponseSchema,
  unitResponseListSchema,
} from "../schemas/units.schema";

const BASE_URL = "/measurement-types";

/**
 * Units (Unidades de medida) service.
 * Handles all API calls for the units feature.
 */
async function listUnits(params?: ListUnitsParams): Promise<UnitResponseList> {
  try {
    const { data } = await apiClient.get<UnitResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });
    const validated = unitResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getUnitBySequence(sequence: number): Promise<UnitResponse> {
  try {
    const { data } = await apiClient.get<UnitResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return unitResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createUnit(dto: CreateUnitDto): Promise<UnitResponse> {
  try {
    const { data } = await apiClient.post<UnitResponse>(BASE_URL, dto);
    return unitResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateUnit(
  id: number,
  dto: UpdateUnitDto,
): Promise<UnitResponse> {
  try {
    const { data } = await apiClient.patch<UnitResponse>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return unitResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteUnit(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const unitsService = {
  list: listUnits,
  getBySequence: getUnitBySequence,
  create: createUnit,
  update: updateUnit,
  delete: deleteUnit,
};
