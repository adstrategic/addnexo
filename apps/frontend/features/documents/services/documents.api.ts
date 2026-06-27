import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";

import {
  documentsGroupedResponseSchema,
  documentsForDocumentResponseSchema,
  documentDownloadResponseSchema,
  uploadDocumentResponseSchema,
} from "../schemas/documents-response.schema";
import type {
  DocumentType,
  DocumentsGroupedResponse,
  DocumentsForDocumentResponse,
  DocumentDownloadResponse,
  UploadDocumentResponse,
  ListDocumentsParams,
} from "../schemas/documents-response.schema";

const BASE_URL = "/documents";

export const documentsApi = {
  async listDocumentsByType(
    params: ListDocumentsParams,
  ): Promise<DocumentsGroupedResponse> {
    try {
      const { type, page = 1, limit = 10, search } = params;
      const { data } = await apiClient.get(`${BASE_URL}/${type}`, {
        params: {
          page,
          limit,
          search: search?.trim() || undefined,
        },
      });
      return documentsGroupedResponseSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async listDocumentsForDocument(
    type: DocumentType,
    sequence: number,
  ): Promise<DocumentsForDocumentResponse> {
    try {
      const { data } = await apiClient.get(`${BASE_URL}/${type}/${sequence}`);
      return documentsForDocumentResponseSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async uploadDocument(
    type: DocumentType,
    sequence: number,
    files: File[],
  ): Promise<UploadDocumentResponse> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("documents", file);
      });

      const { data } = await apiClient.post(
        `${BASE_URL}/${type}/${sequence}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return uploadDocumentResponseSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getDocumentDownloadUrl(
    documentId: number,
    download: boolean = false,
  ): Promise<DocumentDownloadResponse> {
    try {
      const { data } = await apiClient.get(
        `${BASE_URL}/${documentId}/download`,
        { params: { download } },
      );
      return documentDownloadResponseSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteDocument(documentId: number): Promise<void> {
    try {
      await apiClient.delete(`${BASE_URL}/${documentId}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default documentsApi;
