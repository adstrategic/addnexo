import {
  listMovCxcNotesParamsSchema,
  movCxcNoteListResponseSchema,
  movCxcNoteResponseSchema,
  type ListMovCxcNotesParams,
  type MovCxcNoteListResponse,
  type MovCxcNoteResponse,
} from "@/lib/schemas/mov-cxc-note-response.schema";

export const debitNoteResponseSchema = movCxcNoteResponseSchema;
export const debitNoteListResponseSchema = movCxcNoteListResponseSchema;
export const listDebitNotesParamsSchema = listMovCxcNotesParamsSchema;

export type DebitNoteResponse = MovCxcNoteResponse;
export type DebitNoteListResponse = MovCxcNoteListResponse;
export type ListDebitNotesParams = ListMovCxcNotesParams;
