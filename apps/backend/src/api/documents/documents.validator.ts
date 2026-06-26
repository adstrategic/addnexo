import { z } from "zod";

// Document type enum
export const documentTypeSchema = z.enum([
  "dispatch-order",
  "purchase-order",
  "invoice",
]);

// Schema for getting documents by type (type in params, page/limit in query)
export const listDocumentsByTypeParamsSchema = z.object({
  type: documentTypeSchema,
});

export const listDocumentsByTypeQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

// Schema for getting documents for a specific document
export const listDocumentsForDocumentSchema = z.object({
  type: documentTypeSchema,
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Schema for getting document by ID
export const getDocumentByIdSchema = z.object({
  documentId: z.coerce
    .number()
    .int()
    .positive("The document ID must be a positive number"),
});

export const getDocumentDownloadQuerySchema = z.object({
  download: z.enum(["true", "false"]).optional().default("false"),
});

// Schema for uploading documents
export const uploadDocumentSchema = z.object({
  type: documentTypeSchema,
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

// Helper function to convert API document type to Prisma DocumentType
export function mapApiDocumentTypeToPrisma(
  apiType: z.infer<typeof documentTypeSchema>,
): "DISPATCH_ORDER" | "INVOICE" | "PURCHASE_ORDER" {
  switch (apiType) {
    case "dispatch-order":
      return "DISPATCH_ORDER";
    case "invoice":
      return "INVOICE";
    case "purchase-order":
      return "PURCHASE_ORDER";
    default:
      throw new Error(`Unknown document type: ${apiType}`);
  }
}

// Types
export type ListDocumentsByTypeParams = z.infer<
  typeof listDocumentsByTypeParamsSchema
>;
export type ListDocumentsForDocumentParams = z.infer<
  typeof listDocumentsForDocumentSchema
>;
export type GetDocumentByIdParams = z.infer<typeof getDocumentByIdSchema>;
export type UploadDocumentParams = z.infer<typeof uploadDocumentSchema>;
