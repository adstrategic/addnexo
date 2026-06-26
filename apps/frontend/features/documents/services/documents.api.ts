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
} from "../schemas/documents-response.schema";

const BASE_URL = "/documents";

export const documentsApi = {
  // List documents grouped by parent document (for main listing page)
  async listDocumentsByType(
    type: DocumentType,
    page: number = 1,
    limit: number = 50,
  ): Promise<DocumentsGroupedResponse> {
    try {
      const { data } = await apiClient.get(`${BASE_URL}/${type}`, {
        params: { page, limit },
      });
      return documentsGroupedResponseSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // List all documents for a specific document
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

  // Upload documents for a specific document
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

  // Get presigned URL for downloading a document
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

  // Delete a document
  async deleteDocument(documentId: number): Promise<void> {
    try {
      await apiClient.delete(`${BASE_URL}/${documentId}`);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default documentsApi;
