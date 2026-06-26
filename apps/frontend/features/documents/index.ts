// Features exports - Documents Module

// Schemas
export {
  documentTypeSchema,
  documentSchema,
  parentDocumentSchema,
  documentsGroupedResponseSchema,
  documentsForDocumentResponseSchema,
  documentDownloadResponseSchema,
  uploadDocumentResponseSchema,
} from "./schemas/documents-response.schema";

// Types
export type {
  DocumentType,
  Document,
  ParentDocument,
  DocumentsGroupedResponse,
  DocumentsForDocumentResponse,
  DocumentDownloadResponse,
  UploadDocumentResponse,
} from "./schemas/documents-response.schema";

// Hooks
export {
  documentKeys,
  useDocumentsByType,
  useDocumentsForDocument,
  useUploadDocument,
  useDeleteDocument,
  useDocumentDownloadUrl,
} from "./hooks/useDocuments";

// Services
export { documentsApi } from "./services/documents.api";

// Components
export { DocumentsContent } from "./components/DocumentsContent";
export { DocumentsTable } from "./components/DocumentsTable";
