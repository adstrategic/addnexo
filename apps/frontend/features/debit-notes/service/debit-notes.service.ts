import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import {
  debitNoteListResponseSchema,
  debitNoteResponseSchema,
  type DebitNoteListResponse,
  type DebitNoteResponse,
  type ListDebitNotesParams,
} from "../schemas/debit-note-response.schema";

const BASE_URL = "/mov-cxc/debit-notes";

function parseDebitNote(data: unknown): DebitNoteResponse {
  return debitNoteResponseSchema.parse(data);
}

async function list(
  params?: ListDebitNotesParams,
): Promise<DebitNoteListResponse> {
  try {
    const { data } = await apiClient.get(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        estado: params?.estado,
      },
    });
    return debitNoteListResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function getBySequence(secuencia: number): Promise<DebitNoteResponse> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${secuencia}`);
    return parseDebitNote(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const debitNotesService = {
  list,
  getBySequence,
};
