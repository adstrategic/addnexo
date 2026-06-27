import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { documentsApi } from "../services/documents.api";
import type {
  DocumentType,
  ListDocumentsParams,
} from "../schemas/documents-response.schema";

/** Query-key factory for the documents feature. */
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (params: ListDocumentsParams) =>
    [...documentKeys.lists(), params] as const,
  forDocument: (type: DocumentType, sequence: number) =>
    [...documentKeys.all, type, sequence] as const,
};

export function useDocumentsByType(
  params: ListDocumentsParams & { enabled?: boolean },
) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: documentKeys.list(queryParams),
    queryFn: () => documentsApi.listDocumentsByType(queryParams),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useDocumentsForDocument(
  type: DocumentType,
  sequence: number,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: documentKeys.forDocument(type, sequence),
    queryFn: () => documentsApi.listDocumentsForDocument(type, sequence),
    enabled: enabled && !!sequence,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      sequence,
      files,
    }: {
      type: DocumentType;
      sequence: number;
      files: File[];
    }) => documentsApi.uploadDocument(type, sequence, files),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.forDocument(variables.type, variables.sequence),
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
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
    }) => documentsApi.getDocumentDownloadUrl(documentId, download),
  });
}
