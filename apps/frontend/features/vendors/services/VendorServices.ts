import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateVendorDto,
  ListVendorsParams,
  UpdateVendorDto,
  VendorResponse,
  VendorResponseList,
} from "../schemas/VendorSchema";
import {
  vendorResponseListSchema,
  vendorResponseSchema,
} from "../schemas/VendorSchema";

const BASE_URL = "/vendors";

async function listVendors(
  params?: ListVendorsParams,
): Promise<VendorResponseList> {
  try {
    const { data } = await apiClient.get<VendorResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });
    return vendorResponseListSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getVendorBySequence(sequence: number): Promise<VendorResponse> {
  try {
    const { data } = await apiClient.get<VendorResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return vendorResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createVendor(dto: CreateVendorDto): Promise<VendorResponse> {
  try {
    const { data } = await apiClient.post<VendorResponse>(BASE_URL, dto);
    return vendorResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateVendor(
  id: number,
  dto: UpdateVendorDto,
): Promise<VendorResponse> {
  try {
    const { data } = await apiClient.patch<VendorResponse>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return vendorResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteVendor(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

export const vendorsService = {
  list: listVendors,
  getBySequence: getVendorBySequence,
  create: createVendor,
  update: updateVendor,
  delete: deleteVendor,
};
