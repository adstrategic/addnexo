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
  listDocumentsParamsSchema,
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
  ListDocumentsParams,
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
export { useDocumentListParams } from "./hooks/useDocumentListParams";

// Services
export { documentsApi } from "./services/documents.api";

// Components
export { DocumentsContent } from "./components/DocumentsContent";
export { DocumentsTable } from "./components/DocumentsTable";
export { DocumentListToolbar } from "./components/DocumentListToolbar";
export { DocumentTypeTabs } from "./components/DocumentTypeTabs";
export { DocumentPageHeader } from "./components/layout/DocumentPageHeader";

// Utils
export { getDocumentTypeLabel, getDocumentEntityLabel } from "./lib/utils";
