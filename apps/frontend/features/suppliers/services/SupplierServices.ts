import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponse,
  SupplierResponseList,
  ListSuppliersParams,
} from "../schemas/SupplierSchemas";
import {
  supplierResponseSchema,
  supplierResponseListSchema,
} from "../schemas/SupplierSchemas";

const BASE_URL = "/suppliers";

async function listSuppliers(
  params?: ListSuppliersParams,
): Promise<SupplierResponseList> {
  try {
    const { data } = await apiClient.get<SupplierResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });
    const validated = supplierResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getSupplierBySequence(
  sequence: number,
): Promise<SupplierResponse> {
  try {
    const { data } = await apiClient.get<SupplierResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return supplierResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createSupplier(
  dto: CreateSupplierDTO,
): Promise<SupplierResponse> {
  try {
    const { data } = await apiClient.post<SupplierResponse>(BASE_URL, dto);
    return supplierResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateSupplier(
  id: number,
  dto: UpdateSupplierDTO,
): Promise<SupplierResponse> {
  try {
    const { data } = await apiClient.put<SupplierResponse>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return supplierResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteSupplier(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const suppliersService = {
  list: listSuppliers,
  getBySequence: getSupplierBySequence,
  create: createSupplier,
  update: updateSupplier,
  delete: deleteSupplier,
};
