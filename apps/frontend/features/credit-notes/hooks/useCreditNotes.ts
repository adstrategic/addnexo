import { useQuery } from "@tanstack/react-query";
import { creditNotesService } from "../service/credit-notes.service";
import type { ListCreditNotesParams } from "../schemas/credit-note-response.schema";

export const creditNoteKeys = {
  all: ["credit-notes"] as const,
  lists: () => [...creditNoteKeys.all, "list"] as const,
  list: (params?: ListCreditNotesParams) =>
    [...creditNoteKeys.lists(), params] as const,
  details: () => [...creditNoteKeys.all, "detail"] as const,
  detail: (secuencia: number) =>
    [...creditNoteKeys.details(), secuencia] as const,
};

export function useCreditNotes(
  params?: ListCreditNotesParams & { enabled?: boolean },
) {
  const { enabled = true, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: creditNoteKeys.list(queryParams),
    queryFn: () => creditNotesService.list(queryParams),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreditNote(secuencia: number, enabled = true) {
  return useQuery({
    queryKey: creditNoteKeys.detail(secuencia),
    queryFn: () => creditNotesService.getBySequence(secuencia),
    enabled: enabled && !!secuencia,
    staleTime: 0,
    refetchOnMount: true,
  });
}
