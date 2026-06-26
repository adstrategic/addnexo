import type { Request, Response } from "express";

import { DocumentType, EstadoFactura } from "@repo/db";

import { getContext } from "../../middleware/context.middleware.js";
import * as documentService from "../documents/documents.service.js";
import * as service from "./balance-invoices.service.js";
import {
  ActualizarSaldosFacturaDto,
  ActualizarSaldosFacturaItemDto,
  AgregarSaldosFacturaItemDto,
  CrearSaldosFacturaHeaderDto,
} from "./balance-invoices.validator.js";

/**
 * Handler para listar facturas con paginación y filtros
 */
export const listSaldosFacturasHandler = async (
  req: Request<
    {},
    {},
    {},
    {
      clienteId?: string;
      estado?: EstadoFactura;
      fechaDesde?: string;
      fechaHasta?: string;
      page?: string;
      search?: string;
      vendedorId?: string;
    }
  >,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const {
    page = 1,
    search,
    estado,
    clienteId,
    vendedorId,
    fechaDesde,
    fechaHasta,
  } = req.query;
  const limit = 10;

  const { facturas, total } = await service.listSaldosFacturas({
    page: Number(page),
    limit,
    search,
    estado,
    clienteId: clienteId ? Number(clienteId) : undefined,
    vendedorId: vendedorId ? Number(vendedorId) : undefined,
    fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
    fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
    organizationId,
  });

  res.status(200).json({
    data: facturas,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler para obtener una factura por su secuencia
 */
export const getSaldosFacturaBySecuenciaHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const factura = await service.getSaldosFacturaBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!factura) {
    return res.status(404).json({ message: "Invoice not found." });
  }

  res.status(200).json(factura);
};

/**
 * Handler para obtener el siguiente número de factura
 */
export const getSiguienteNumeroFacturaHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const siguienteNumero =
    await service.getSiguienteNumeroFactura(organizationId);

  res.status(200).json({ siguienteNumero });
};

/**
 * Handler para actualizar una factura en estado DRAFT
 * NOTA: Esta función está deshabilitada. Usar los endpoints de items individuales en su lugar.
 */
export const updateSaldosFacturaHandler = async (
  req: Request<{ id: string }, {}, ActualizarSaldosFacturaDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const factura = await service.updateSaldosFactura(
    Number(id),
    data,
    organizationId,
  );

  res.status(200).json({
    message: "Invoice updated successfully",
    factura,
  });
};

/**
 * Handler para listar documentos de una factura
 */
export const listFacturaDocumentsHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  // First get the factura to get its internal ID
  const factura = await service.getSaldosFacturaBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!factura) {
    return res.status(404).json({ message: "Factura not found." });
  }

  const documents = await documentService.listDocumentsForDocument(
    DocumentType.DISPATCH_ORDER,
    factura.FGId,
    organizationId,
  );

  res.status(200).json({ documents });
};

/**
 * Handler para obtener URL firmada para descargar un documento
 */
export const getDocumentDownloadUrlHandler = async (
  req: Request<{ documentId: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { documentId } = req.params;

  const result = await documentService.getDocumentSignedUrl(
    Number(documentId),
    organizationId,
    false,
  );

  res.status(200).json(result);
};

/**
 * Handler para eliminar un documento
 */
export const deleteDocumentHandler = async (
  req: Request<{ documentId: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { documentId } = req.params;

  await documentService.deleteDocument(Number(documentId), organizationId);

  res.status(200).json({ message: "Document deleted successfully" });
};

// ===== NUEVOS HANDLERS PARA PERSISTENCIA EN TIEMPO REAL =====

/**
 * Handler para crear solo el encabezado de una factura
 */
export const createSaldosFacturaHeaderHandler = async (
  req: Request<{}, {}, CrearSaldosFacturaHeaderDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const factura = await service.createSaldosFacturaHeader(
    data,
    organizationId,
    userEmail,
  );

  res.status(201).json({
    message: "Factura header created successfully",
    factura,
  });
};

/**
 * Handler para agregar un item a una factura
 */
export const addSaldosFacturaItemHandler = async (
  req: Request<{ id: string }, {}, AgregarSaldosFacturaItemDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id } = req.params;
  const itemData = req.body;

  // Obtener la factura
  const factura = await service.getSaldosFacturaBySecuencia(
    Number(id),
    organizationId,
  );

  if (!factura) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const items = await service.addSaldosFacturaItem(
    Number(id),
    itemData,
    organizationId,
    userEmail,
  );

  res.status(201).json({
    message: "Item(s) added successfully",
    items,
  });
};

/**
 * Handler para actualizar un item completo
 */
export const updateSaldosFacturaItemHandler = async (
  req: Request<
    { id: string; itemId: string },
    {},
    ActualizarSaldosFacturaItemDto
  >,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id, itemId } = req.params;
  const updateData = req.body;

  if (!updateData) {
    return res.status(400).json({ message: "No data to update" });
  }

  // Obtener la factura para validar que existe
  const factura = await service.getSaldosFacturaBySecuencia(
    Number(id),
    organizationId,
  );

  if (!factura) {
    return res.status(404).json({ message: "Factura not found" });
  }

  const items = await service.updateSaldosFacturaItem(
    Number(id),
    Number(itemId),
    updateData,
    organizationId,
    userEmail,
  );

  res.status(200).json({
    message: "Item updated successfully",
    items,
  });
};

/**
 * Handler para eliminar una factura en estado DRAFT
 */
export const deleteSaldosFacturaHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteSaldosFactura(Number(id), organizationId);

  res.status(204).send();
};
