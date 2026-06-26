import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DocumentType, prisma, type Prisma } from "@repo/db";

import { S3_BUCKET_NAME, s3Client } from "../../config/aws.config.js";

/**
 * Sanitize a string for use in filenames
 * Removes special characters, accents, and converts spaces to hyphens
 */
function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .toLowerCase()
    .trim();
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.substring(lastDot) : "";
}

/**
 * Generate document filename following convention:
 * {document-type}-{number}-{client-name}[-{index}].{extension}
 */
async function generateDocumentFileName(
  documentType: DocumentType,
  documentId: number,
  organizationId: string,
  originalFilename: string,
  index?: number,
): Promise<string> {
  let documentNumber: number;
  let entityName: string;

  switch (documentType) {
    case "DISPATCH_ORDER": {
      const dispatchOrder = await prisma.dispatchOrderG.findUnique({
        where: { DOGId: documentId },
        include: { cltemae: true },
      });
      if (!dispatchOrder) {
        throw new Error("Dispatch order not found");
      }
      documentNumber = dispatchOrder.DOGNro;
      entityName = dispatchOrder.cltemae.CRazonSocial || "unknown";
      break;
    }
    case "INVOICE": {
      const invoice = await prisma.facturag.findUnique({
        where: { FGId: documentId },
        include: { cltemae: true },
      });
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      documentNumber = invoice.FGNro;
      entityName = invoice.cltemae.CRazonSocial || "unknown";
      break;
    }
    case "PURCHASE_ORDER": {
      const purchaseOrder = await prisma.paprovee.findUnique({
        where: { PPId: documentId },
        include: { mproved: true },
      });
      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
      documentNumber = purchaseOrder.PPNro;
      entityName = purchaseOrder.mproved.MPDescripcion || "unknown";
      break;
    }
    default:
      throw new Error(`Unknown document type`);
  }

  const sanitizedEntityName = sanitizeFilename(entityName);
  const extension = getFileExtension(originalFilename);
  const typePrefix =
    documentType === "DISPATCH_ORDER"
      ? "dispatch-order"
      : documentType === "PURCHASE_ORDER"
        ? "purchase-order"
        : "invoice";

  let filename = `${typePrefix}-${documentNumber}-${sanitizedEntityName}`;
  if (index !== undefined && index > 0) {
    filename += `-${index}`;
  }
  filename += extension;

  return filename;
}

/**
 * Upload documents to S3 and save metadata to database
 */
export const uploadDocument = async (
  files: Express.Multer.File[],
  documentType: DocumentType,
  documentId: number,
  organizationId: string,
  usuario: string,
) => {
  if (files.length === 0) {
    throw new Error("At least one document is required");
  }

  const uploadedDocuments = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) {
      continue;
    }

    // Generate system filename following convention
    const systemFileName = await generateDocumentFileName(
      documentType,
      documentId,
      organizationId,
      file.originalname,
      files.length > 1 ? i + 1 : undefined,
    );

    // Generate S3 key: {organizationId}/{document-type}/{documentId}/{timestamp}-{systemFileName}
    const timestamp = Date.now();
    const typeFolder =
      documentType === "DISPATCH_ORDER"
        ? "dispatch-orders"
        : documentType === "PURCHASE_ORDER"
          ? "purchase-orders"
          : "invoices";
    const s3Key = `${organizationId}/${typeFolder}/${documentId}/${timestamp}-${systemFileName}`;

    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: usuario,
        organizationId,
      },
    });

    await s3Client.send(putCommand);

    // Save metadata to database
    const document = await prisma.document.create({
      data: {
        DOCOrganizationId: organizationId,
        DOCDocumentType: documentType,
        DOCDocumentId: documentId,
        DOCFileName: systemFileName,
        DOCOriginalFileName: file.originalname,
        DOCFileKey: s3Key,
        DOCFileSize: file.size,
        DOCMimeType: file.mimetype,
        DOCUploadedBy: usuario,
      },
    });

    uploadedDocuments.push(document);
  }

  return uploadedDocuments;
};

/**
 * Upload a document buffer to S3 and save metadata to database
 * Used for programmatically generated documents (PDFs, etc.)
 */
export const uploadDocumentBuffer = async (
  buffer: Buffer,
  filename: string,
  documentType: DocumentType,
  documentId: number,
  organizationId: string,
  usuario: string,
  mimeType = "application/pdf",
) => {
  // Generate system filename following convention
  const systemFileName = await generateDocumentFileName(
    documentType,
    documentId,
    organizationId,
    filename,
    undefined,
  );

  // Generate S3 key
  const timestamp = Date.now();
  const typeFolder =
    documentType === "DISPATCH_ORDER"
      ? "dispatch-orders"
      : documentType === "PURCHASE_ORDER"
        ? "purchase-orders"
        : "invoices";
  const s3Key = `${organizationId}/${typeFolder}/${documentId}/${timestamp}-${systemFileName}`;

  // Upload to S3
  const putCommand = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: mimeType,
    Metadata: {
      originalName: filename,
      uploadedBy: usuario,
      organizationId,
    },
  });

  await s3Client.send(putCommand);

  // Save metadata to database
  const document = await prisma.document.create({
    data: {
      DOCOrganizationId: organizationId,
      DOCDocumentType: documentType,
      DOCDocumentId: documentId,
      DOCFileName: systemFileName,
      DOCOriginalFileName: filename,
      DOCFileKey: s3Key,
      DOCFileSize: buffer.length,
      DOCMimeType: mimeType,
      DOCUploadedBy: usuario,
    },
  });

  return document;
};

/** DB filter for programmatic dispatch-order PDFs (same convention as outbox emit). */
export function dispatchOrderEmittedAutoPdfWhere(
  dispatchOrderGId: number,
  dispatchOrderNro: number,
  organizationId: string,
): Prisma.DocumentWhereInput {
  return {
    DOCDocumentType: DocumentType.DISPATCH_ORDER,
    DOCDocumentId: dispatchOrderGId,
    DOCOrganizationId: organizationId,
    DOCMimeType: "application/pdf",
    DOCOriginalFileName: `dispatch-order-${dispatchOrderNro}.pdf`,
  };
}

/** Latest programmatic dispatch PDF row for this order (emit / regenerate). */
export async function findLatestDispatchOrderEmittedAutoPdf(
  dispatchOrderGId: number,
  dispatchOrderNro: number,
  organizationId: string,
) {
  return prisma.document.findFirst({
    where: dispatchOrderEmittedAutoPdfWhere(
      dispatchOrderGId,
      dispatchOrderNro,
      organizationId,
    ),
    orderBy: { DOCUploadedAt: "desc" },
  });
}

/** Read an object from S3 into a Buffer (attach existing PDFs without regenerating). */
export async function getObjectBuffer(s3Key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
    }),
  );
  const body = response.Body;
  if (!body) {
    throw new Error(`S3 GetObject returned empty body for key: ${s3Key}`);
  }
  const bytes = await body.transformToByteArray();
  return Buffer.from(bytes);
}

/**
 * Uploads the emitted dispatch-order PDF buffer to S3 only (no DB row).
 * Used with a DB transaction that inserts the `document` row afterward.
 */
export async function putDispatchOrderEmittedAutoPdfBufferToS3(
  buffer: Buffer,
  dispatchOrderGId: number,
  dispatchOrderNro: number,
  organizationId: string,
  usuario: string,
  mimeType = "application/pdf",
): Promise<{
  DOCFileSize: number;
  DOCMimeType: string;
  DOCOriginalFileName: string;
  s3Key: string;
  systemFileName: string;
}> {
  const filename = `dispatch-order-${dispatchOrderNro}.pdf`;
  const systemFileName = await generateDocumentFileName(
    DocumentType.DISPATCH_ORDER,
    dispatchOrderGId,
    organizationId,
    filename,
    undefined,
  );
  const timestamp = Date.now();
  const s3Key = `${organizationId}/dispatch-orders/${dispatchOrderGId}/${timestamp}-${systemFileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalName: filename,
        uploadedBy: usuario,
        organizationId,
      },
    }),
  );

  return {
    systemFileName,
    s3Key,
    DOCOriginalFileName: filename,
    DOCFileSize: buffer.length,
    DOCMimeType: mimeType,
  };
}

export async function deleteS3ObjectsBestEffort(keys: string[]): Promise<void> {
  for (const key of keys) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key,
        }),
      );
    } catch (err) {
      console.error(
        `[deleteS3ObjectsBestEffort] S3 delete failed for ${key}:`,
        err,
      );
    }
  }
}

/**
 * Deletes auto-generated dispatch order PDF rows and S3 objects created on emit
 * (DOCOriginalFileName `dispatch-order-{nro}.pdf`). User uploads at dispatch use other names.
 */
export async function removeAutoGeneratedDispatchOrderEmittedPdfs(
  dispatchOrderGId: number,
  dispatchOrderNro: number,
  organizationId: string,
): Promise<void> {
  const docs = await prisma.document.findMany({
    where: dispatchOrderEmittedAutoPdfWhere(
      dispatchOrderGId,
      dispatchOrderNro,
      organizationId,
    ),
  });

  for (const doc of docs) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: doc.DOCFileKey,
        }),
      );
    } catch (err) {
      console.error(
        `[removeAutoGeneratedDispatchOrderEmittedPdfs] S3 delete failed for ${doc.DOCFileKey}:`,
        err,
      );
    }
    await prisma.document.delete({
      where: { DOCId: doc.DOCId },
    });
  }
}

/**
 * List all documents of a specific type
 */
export const listDocumentsByType = async (
  documentType: DocumentType,
  organizationId: string,
  page = 1,
  limit = 50,
) => {
  const skip = (page - 1) * limit;

  const [documents, total] = await prisma.$transaction([
    prisma.document.findMany({
      where: {
        DOCDocumentType: documentType,
        DOCOrganizationId: organizationId,
      },
      skip,
      take: limit,
      orderBy: {
        DOCUploadedAt: "desc",
      },
    }),
    prisma.document.count({
      where: {
        DOCDocumentType: documentType,
        DOCOrganizationId: organizationId,
      },
    }),
  ]);

  return { documents, total, page, limit };
};

/**
 * List all documents for a specific document (dispatch order, purchase order, or invoice)
 */
export const listDocumentsForDocument = async (
  documentType: DocumentType,
  documentId: number,
  organizationId: string,
) => {
  return prisma.document.findMany({
    where: {
      DOCDocumentType: documentType,
      DOCDocumentId: documentId,
      DOCOrganizationId: organizationId,
    },
    orderBy: {
      DOCUploadedAt: "desc",
    },
  });
};

/**
 * Get documents grouped by parent document (for listing page)
 * Returns unique parent documents with their document counts
 */
export const listDocumentsGroupedByParent = async (
  documentType: DocumentType,
  organizationId: string,
  page = 1,
  limit = 50,
) => {
  const skip = (page - 1) * limit;

  // Get all documents of this type
  const allDocuments = await prisma.document.findMany({
    where: {
      DOCDocumentType: documentType,
      DOCOrganizationId: organizationId,
    },
    orderBy: {
      DOCUploadedAt: "desc",
    },
  });

  // Group by document ID
  const grouped = new Map<
    number,
    {
      count: number;
      documentId: number;
      latestUpload: Date;
    }
  >();

  for (const doc of allDocuments) {
    const existing = grouped.get(doc.DOCDocumentId);
    if (!existing || doc.DOCUploadedAt > existing.latestUpload) {
      grouped.set(doc.DOCDocumentId, {
        documentId: doc.DOCDocumentId,
        count: (existing?.count || 0) + 1,
        latestUpload: doc.DOCUploadedAt,
      });
    } else {
      existing.count += 1;
    }
  }

  // Convert to array and sort by latest upload
  const groupedArray = Array.from(grouped.values()).sort(
    (a, b) => b.latestUpload.getTime() - a.latestUpload.getTime(),
  );

  // Paginate
  const total = groupedArray.length;
  const paginated = groupedArray.slice(skip, skip + limit);

  // Fetch parent document details
  const parentDocuments = await Promise.all(
    paginated.map(async (group) => {
      switch (documentType) {
        case "DISPATCH_ORDER": {
          const dispatchOrder = await prisma.dispatchOrderG.findUnique({
            where: { DOGId: group.documentId },
            include: { cltemae: true },
          });
          if (!dispatchOrder) return null;
          return {
            sequence: dispatchOrder.DOGOrgSecuencia,
            number: dispatchOrder.DOGNro,
            clientName: dispatchOrder.cltemae.CRazonSocial,
            date: dispatchOrder.DOGFechaCreado,
            documentCount: group.count,
          };
        }
        case "INVOICE": {
          const invoice = await prisma.facturag.findUnique({
            where: { FGId: group.documentId },
            include: { cltemae: true },
          });
          if (!invoice) return null;
          return {
            sequence: invoice.FGOrgSecuencia,
            number: invoice.FGNro,
            clientName: invoice.cltemae.CRazonSocial,
            date: invoice.FGFechaCreado,
            documentCount: group.count,
          };
        }
        case "PURCHASE_ORDER": {
          const purchaseOrder = await prisma.paprovee.findUnique({
            where: { PPId: group.documentId },
            include: { mproved: true },
          });
          if (!purchaseOrder) return null;
          return {
            sequence: purchaseOrder.PPOrgSecuencia,
            number: purchaseOrder.PPNro,
            supplierName: purchaseOrder.mproved.MPDescripcion,
            date: purchaseOrder.PPFechaPedido,
            documentCount: group.count,
          };
        }
        default:
          return null;
      }
    }),
  );

  return {
    documents: parentDocuments.filter((d) => d !== null),
    total,
    page,
    limit,
  };
};

/**
 * Generate a presigned URL for downloading a document (valid for 1 hour)
 */
export const getDocumentSignedUrl = async (
  documentId: number,
  organizationId: string,
  download = false,
) => {
  const document = await prisma.document.findUnique({
    where: {
      DOCId: documentId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Verify organization access
  if (document.DOCOrganizationId !== organizationId) {
    throw new Error(
      "Access denied: Document belongs to different organization",
    );
  }

  const getCommand = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: document.DOCFileKey,
    ResponseContentDisposition: download
      ? `attachment; filename="${document.DOCFileName}"`
      : undefined,
  });

  // Generate presigned URL valid for 1 hour
  const signedUrl = await getSignedUrl(s3Client, getCommand, {
    expiresIn: 3600, // 1 hour
  });

  return {
    url: signedUrl,
    fileName: document.DOCFileName,
    mimeType: document.DOCMimeType,
  };
};

/**
 * Delete a document from S3 and database
 */
export const deleteDocument = async (
  documentId: number,
  organizationId: string,
) => {
  const document = await prisma.document.findUnique({
    where: {
      DOCId: documentId,
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Verify organization access
  if (document.DOCOrganizationId !== organizationId) {
    throw new Error(
      "Access denied: Document belongs to different organization",
    );
  }

  // Delete from S3
  const deleteCommand = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: document.DOCFileKey,
  });

  await s3Client.send(deleteCommand);

  // Delete from database
  await prisma.document.delete({
    where: {
      DOCId: documentId,
    },
  });

  return { success: true };
};
