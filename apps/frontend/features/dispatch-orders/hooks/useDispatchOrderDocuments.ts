import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";
import {
  dispatchOrderDocumentsService,
  type DispatchOrderDocument,
} from "../service/dispatch-order-documents.service";
import { dispatchOrderKeys } from "./useDispatchOrders";

export type { DispatchOrderDocument };

export function useDispatchOrderDocuments(
  sequence: number,
  enabled = true,
) {
  return useQuery({
    queryKey: dispatchOrderKeys.documents(sequence),
    queryFn: () => dispatchOrderDocumentsService.listDocuments(sequence),
    enabled: enabled && !!sequence,
  });
}

export function useDispatchOrderWithFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sequence, files }: { sequence: number; files: File[] }) =>
      dispatchOrderDocumentsService.dispatchWithDocuments(sequence, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.documents(variables.sequence),
      });
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      toast.success("Dispatch order dispatched");
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useDocumentDownloadUrl() {
  return useMutation({
    mutationFn: ({
      documentId,
      download = false,
    }: {
      documentId: number;
      download?: boolean;
    }) =>
      dispatchOrderDocumentsService.getDocumentDownloadUrl(documentId, download),
    onError: (err) => handleMutationError(err),
  });
}
