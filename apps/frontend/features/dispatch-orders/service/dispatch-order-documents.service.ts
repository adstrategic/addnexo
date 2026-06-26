import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import { z } from "zod";
import {
  dispatchOrderResponseSchema,
  type DispatchOrderResponse,
} from "../schemas/dispatch-order-response.schema";

const BASE_URL = "/dispatch-orders";

export interface DispatchOrderDocument {
  DOCId: number;
  DOCOrganizacionId: string;
  DOCDocumentType: "DISPATCH_ORDER" | "PURCHASE_ORDER" | "INVOICE";
  DOCDocumentId: number;
  DOCFileName: string;
  DOCOriginalFileName: string;
  DOCFileKey: string;
  DOCFileSize: number;
  DOCMimeType: string;
  DOCUploadedAt: string;
  DOCUploadedBy: string;
}

export interface DocumentsResponse {
  documents: DispatchOrderDocument[];
}

export interface DocumentDownloadResponse {
  url: string;
  fileName: string;
  mimeType: string;
}

const documentsResponseSchema = z.object({
  documents: z.array(z.record(z.string(), z.unknown())),
});

const documentDownloadResponseSchema = z.object({
  url: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
});

async function dispatchWithDocuments(
  sequence: number,
  files: File[],
): Promise<DispatchOrderResponse> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    const { data } = await apiClient.post(
      `${BASE_URL}/${sequence}/dispatch`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return dispatchOrderResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function listDocuments(sequence: number): Promise<DocumentsResponse> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${sequence}/documents`);
    const validated = documentsResponseSchema.parse(data);
    return {
      documents: validated.documents as unknown as DispatchOrderDocument[],
    };
  } catch (error) {
    handleApiError(error);
  }
}

async function getDocumentDownloadUrl(
  documentId: number,
  download = false,
): Promise<DocumentDownloadResponse> {
  try {
    const { data } = await apiClient.get(
      `${BASE_URL}/documents/${documentId}/download`,
      { params: { download: download ? "true" : "false" } },
    );
    return documentDownloadResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteDocument(documentId: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/documents/${documentId}`);
  } catch (error) {
    handleApiError(error);
  }
}

export const dispatchOrderDocumentsService = {
  dispatchWithDocuments,
  listDocuments,
  getDocumentDownloadUrl,
  deleteDocument,
};
