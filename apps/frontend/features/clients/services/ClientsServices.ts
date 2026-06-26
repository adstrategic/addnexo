import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateClientDto,
  UpdateClientDto,
  ClienteResponse,
  ClientesResponse,
  ListClientsParams,
} from "../schemas/ClientSchema";
import {
  clientResponseSchema,
  clientResponseListSchema,
} from "../schemas/ClientSchema";

const BASE_URL = "/clients";

async function listClients(
  params?: ListClientsParams,
): Promise<ClientesResponse> {
  try {
    const { data } = await apiClient.get<ClientesResponse>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });

    const validated = clientResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getClientBySequence(sequence: number): Promise<ClienteResponse> {
  try {
    const { data } = await apiClient.get<ClienteResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return clientResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createClient(dto: CreateClientDto): Promise<ClienteResponse> {
  try {
    const { data } = await apiClient.post<ClienteResponse>(BASE_URL, dto);
    return clientResponseSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function updateClient(
  id: number,
  dto: UpdateClientDto,
): Promise<ClienteResponse> {
  try {
    const { data } = await apiClient.put<ClienteResponse>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return clientResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteClient(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

export const clientsService = {
  list: listClients,
  getBySequence: getClientBySequence,
  create: createClient,
  update: updateClient,
  delete: deleteClient,
};
