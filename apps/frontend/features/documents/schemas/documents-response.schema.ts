import { z } from "zod";

/** API-facing document type slug (matches backend route params). */
export const documentTypeSchema = z.enum([
  "dispatch-order",
  "purchase-order",
  "invoice",
]);

/** A single uploaded file (Prisma `Document` row, serialized over HTTP). */
export const documentSchema = z
  .object({
    DOCId: z.number().int().positive(),
    DOCOrganizationId: z.string(),
    DOCDocumentType: z.enum(["DISPATCH_ORDER", "PURCHASE_ORDER", "INVOICE"]),
    DOCDocumentId: z.number().int(),
    DOCFileName: z.string(),
    DOCOriginalFileName: z.string(),
    DOCFileKey: z.string(),
    DOCFileSize: z.number().int(),
    DOCMimeType: z.string(),
    // Dates arrive as ISO strings over the wire.
    DOCUploadedAt: z.string(),
    DOCUploadedBy: z.string(),
  })
  .loose();

/** A parent record (dispatch order / invoice / purchase order) with its file count. */
export const parentDocumentSchema = z
  .object({
    sequence: z.number().int(),
    number: z.number().int(),
    clientName: z.string().optional(),
    supplierName: z.string().optional(),
    date: z.string(),
    documentCount: z.number().int(),
  })
  .loose();

/** GET /documents/:type — grouped-by-parent listing. */
export const documentsGroupedResponseSchema = z.object({
  documents: z.array(parentDocumentSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

/** GET /documents/:type/:sequence — files for a single parent. */
export const documentsForDocumentResponseSchema = z.object({
  documents: z.array(documentSchema),
});

/** GET /documents/:documentId/download — presigned URL. */
export const documentDownloadResponseSchema = z
  .object({
    url: z.string(),
    fileName: z.string().optional(),
    mimeType: z.string().optional(),
  })
  .loose();

/** POST /documents/:type/:sequence — upload result. */
export const uploadDocumentResponseSchema = z
  .object({
    message: z.string(),
    documents: z.array(documentSchema),
  })
  .loose();

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type Document = z.infer<typeof documentSchema>;
export type ParentDocument = z.infer<typeof parentDocumentSchema>;
export type DocumentsGroupedResponse = z.infer<
  typeof documentsGroupedResponseSchema
>;
export type DocumentsForDocumentResponse = z.infer<
  typeof documentsForDocumentResponseSchema
>;
export type DocumentDownloadResponse = z.infer<
  typeof documentDownloadResponseSchema
>;
export type UploadDocumentResponse = z.infer<
  typeof uploadDocumentResponseSchema
>;
