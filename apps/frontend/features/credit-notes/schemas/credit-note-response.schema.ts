import {
  listMovCxcNotesParamsSchema,
  movCxcNoteListResponseSchema,
  movCxcNoteResponseSchema,
  type ListMovCxcNotesParams,
  type MovCxcNoteListResponse,
  type MovCxcNoteResponse,
} from "@/lib/schemas/mov-cxc-note-response.schema";

export const creditNoteResponseSchema = movCxcNoteResponseSchema;
export const creditNoteListResponseSchema = movCxcNoteListResponseSchema;
export const listCreditNotesParamsSchema = listMovCxcNotesParamsSchema;

export type CreditNoteResponse = MovCxcNoteResponse;
export type CreditNoteListResponse = MovCxcNoteListResponse;
export type ListCreditNotesParams = ListMovCxcNotesParams;
