import type { Request, Response } from "express";

import { prisma } from "@repo/db";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./documents.service.js";
import { mapApiDocumentTypeToPrisma } from "./documents.validator.js";

/**
 * Helper function to get document ID from sequence based on document type
 */
async function getDocumentIdFromSequence(
  documentType: "DISPATCH_ORDER" | "INVOICE" | "PURCHASE_ORDER",
  sequence: number,
  organizationId: string,
): Promise<number> {
  switch (documentType) {
    case "DISPATCH_ORDER": {
      const dispatchOrder = await prisma.dispatchOrderG.findUnique({
        where: {
          DOGOrganizationId_DOGOrgSecuencia: {
            DOGOrganizationId: organizationId,
            DOGOrgSecuencia: sequence,
          },
        },
      });
      if (!dispatchOrder) {
        throw new Error("Dispatch order not found");
      }
      return dispatchOrder.DOGId;
    }
    case "INVOICE": {
      const invoice = await prisma.facturag.findUnique({
        where: {
          FGOrganizationId_FGOrgSecuencia: {
            FGOrganizationId: organizationId,
            FGOrgSecuencia: sequence,
          },
        },
      });
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      return invoice.FGId;
    }
    case "PURCHASE_ORDER": {
      const purchaseOrder = await prisma.paprovee.findUnique({
        where: {
          PPOrganizationId_PPOrgSecuencia: {
            PPOrganizationId: organizationId,
            PPOrgSecuencia: sequence,
          },
        },
      });
      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }
      return purchaseOrder.PPId;
    }
    default:
      throw new Error(`Unknown document type`);
  }
}

/**
 * Handler para listar documentos agrupados por tipo
 * GET /api/inventario/documents/:type
 */
export const listDocumentsByTypeHandler = async (
  req: Request<
    { type: string },
    {},
    {},
    {
      limit?: string;
      page?: string;
      search?: string;
    }
  >,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { type } = req.params;
  const { page, limit } = req.query;

  const documentType = mapApiDocumentTypeToPrisma(
    type as "dispatch-order" | "invoice" | "purchase-order",
  );
  const result = await service.listDocumentsGroupedByParent(
    documentType,
    organizationId,
    Number(page),
    Number(limit),
  );

  res.status(200).json(result);
};

/**
 * Handler para listar documentos de un documento específico
 * GET /api/inventario/documents/:type/:sequence
 */
export const listDocumentsForDocumentHandler = async (
  req: Request<{ sequence: string; type: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { type, sequence } = req.params;

  const documentType = mapApiDocumentTypeToPrisma(
    type as "dispatch-order" | "invoice" | "purchase-order",
  );
  const documentId = await getDocumentIdFromSequence(
    documentType,
    Number(sequence),
    organizationId,
  );

  const documents = await service.listDocumentsForDocument(
    documentType,
    documentId,
    organizationId,
  );

  res.status(200).json({ documents });
};

/**
 * Handler para subir documentos
 * POST /api/inventario/documents/:type/:sequence
 */
export const uploadDocumentHandler = async (
  req: Request<{ sequence: string; type: string }>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { type, sequence } = req.params;
  const files = req.files as Express.Multer.File[];

  if (files.length === 0) {
    return res.status(400).json({
      message: "At least one document is required",
    });
  }

  const documentType = mapApiDocumentTypeToPrisma(
    type as "dispatch-order" | "invoice" | "purchase-order",
  );
  const documentId = await getDocumentIdFromSequence(
    documentType,
    Number(sequence),
    organizationId,
  );

  const uploadedDocuments = await service.uploadDocument(
    files,
    documentType,
    documentId,
    organizationId,
    userEmail,
  );

  res.status(200).json({
    message: "Documents uploaded successfully",
    documents: uploadedDocuments,
  });
};

/**
 * Handler para obtener URL firmada para descargar un documento
 * GET /api/inventario/documents/:documentId/download
 */
export const getDocumentDownloadUrlHandler = async (
  req: Request<{ documentId: string }, {}, {}, { download?: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { documentId } = req.params;
  const { download } = req.query;

  const result = await service.getDocumentSignedUrl(
    Number(documentId),
    organizationId,
    download === "true",
  );

  res.status(200).json(result);
};

/**
 * Handler para eliminar un documento
 * DELETE /api/v1/documents/:documentId
 */
export const deleteDocumentHandler = async (
  req: Request<{ documentId: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { documentId } = req.params;

  await service.deleteDocument(Number(documentId), organizationId);

  res.status(200).json({ message: "Document deleted successfully" });
};
