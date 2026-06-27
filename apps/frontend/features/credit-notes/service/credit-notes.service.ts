import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import {
  creditNoteListResponseSchema,
  creditNoteResponseSchema,
  type CreditNoteListResponse,
  type CreditNoteResponse,
  type ListCreditNotesParams,
} from "../schemas/credit-note-response.schema";

const BASE_URL = "/mov-cxc/credit-notes";

function parseCreditNote(data: unknown): CreditNoteResponse {
  return creditNoteResponseSchema.parse(data);
}

async function list(
  params?: ListCreditNotesParams,
): Promise<CreditNoteListResponse> {
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
    return creditNoteListResponseSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getBySequence(secuencia: number): Promise<CreditNoteResponse> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${secuencia}`);
    return parseCreditNote(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const creditNotesService = {
  list,
  getBySequence,
};
