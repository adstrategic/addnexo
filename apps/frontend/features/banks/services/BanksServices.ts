import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  BankResponse,
  BanksResponse,
  CreateBankDto,
  UpdateBankDto,
  ListBanksParams,
} from "../schemas/BankSchema";
import {
  bankResponseSchema,
  bankResponseListSchema,
} from "../schemas/BankSchema";

const BASE_URL = "/banks";

/**
 * Banks service.
 * Handles all API calls for the banks feature. Update/delete operate on the
 * organization sequence (`BOrgSecuencia`), matching the backend routes.
 */
async function listBanks(params?: ListBanksParams): Promise<BanksResponse> {
  try {
    const { data } = await apiClient.get<BanksResponse>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });

    const validated = bankResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getBankBySequence(sequence: number): Promise<BankResponse> {
  try {
    const { data } = await apiClient.get<BankResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return bankResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createBank(dto: CreateBankDto): Promise<BankResponse> {
  try {
    const { data } = await apiClient.post<BankResponse>(BASE_URL, dto);
    return bankResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateBank(
  sequence: number,
  dto: UpdateBankDto,
): Promise<BankResponse> {
  try {
    const { data } = await apiClient.put<BankResponse>(
      `${BASE_URL}/${sequence}`,
      dto,
    );
    return bankResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteBank(sequence: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${sequence}`);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const banksService = {
  list: listBanks,
  getBySequence: getBankBySequence,
  create: createBank,
  update: updateBank,
  delete: deleteBank,
};
