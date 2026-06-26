// features/documents/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import documentsApi from "../services/documents.api";
import type { DocumentType } from "../types/documents-types";

/** Query-key factory for the documents feature. */
export const documentKeys = {
  all: ["documents"] as const,
  byType: (type: DocumentType, page?: number, limit?: number) =>
    [...documentKeys.all, type, page, limit] as const,
  forDocument: (type: DocumentType, sequence: number) =>
    [...documentKeys.all, type, sequence] as const,
};

/**
 * Hook to fetch documents grouped by parent document (for main listing page)
 */
export function useDocumentsByType(
  type: DocumentType,
  page: number = 1,
  limit: number = 50,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: documentKeys.byType(type, page, limit),
    queryFn: () => documentsApi.listDocumentsByType(type, page, limit),
    enabled,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch all documents for a specific document
 */
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

/**
 * Hook to upload documents
 */
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
      // Invalidate queries for this document type and sequence
      queryClient.invalidateQueries({
        queryKey: documentKeys.forDocument(variables.type, variables.sequence),
      });
      queryClient.invalidateQueries({
        queryKey: [...documentKeys.all, variables.type],
      });
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number) => documentsApi.deleteDocument(documentId),
    onSuccess: () => {
      // Invalidate all document queries
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

/**
 * Hook to get document download URL
 */
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
