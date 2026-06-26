// Re-exports the document types (inferred from the Zod response schemas) so
// consumers can import them from a stable `types/` path.
export type {
  DocumentType,
  Document,
  ParentDocument,
  DocumentsGroupedResponse,
  DocumentsForDocumentResponse,
  DocumentDownloadResponse,
  UploadDocumentResponse,
} from "../schemas/documents-response.schema";
