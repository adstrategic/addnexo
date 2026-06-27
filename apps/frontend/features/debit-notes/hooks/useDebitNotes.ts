import { useQuery } from "@tanstack/react-query";
import { debitNotesService } from "../service/debit-notes.service";
import type { ListDebitNotesParams } from "../schemas/debit-note-response.schema";

export const debitNoteKeys = {
  all: ["debit-notes"] as const,
  lists: () => [...debitNoteKeys.all, "list"] as const,
  list: (params?: ListDebitNotesParams) =>
    [...debitNoteKeys.lists(), params] as const,
  details: () => [...debitNoteKeys.all, "detail"] as const,
  detail: (secuencia: number) =>
    [...debitNoteKeys.details(), secuencia] as const,
};

export function useDebitNotes(
  params?: ListDebitNotesParams & { enabled?: boolean },
) {
  const { enabled = true, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: debitNoteKeys.list(queryParams),
    queryFn: () => debitNotesService.list(queryParams),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useDebitNote(secuencia: number, enabled = true) {
  return useQuery({
    queryKey: debitNoteKeys.detail(secuencia),
    queryFn: () => debitNotesService.getBySequence(secuencia),
    enabled: enabled && !!secuencia,
    staleTime: 0,
    refetchOnMount: true,
  });
}
