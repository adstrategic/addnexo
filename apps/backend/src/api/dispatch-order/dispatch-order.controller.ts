import type { Request, Response } from "express";

import { DocumentType, EstadoDispatchOrder } from "@repo/db";

import { getContext } from "../../middleware/context.middleware.js";
import * as documentService from "../documents/documents.service.js";
import * as service from "./dispatch-order.service.js";
import {
  ActualizarCantidadDevueltaDto,
  ActualizarDispatchOrderDto,
  ActualizarDispatchOrderItemDto,
  AgregarDispatchOrderItemDto,
  AnularDispatchOrderDto,
  CrearDevolucionesDto,
  CrearDispatchOrderHeaderDto,
  EmitirDispatchOrderDto,
} from "./dispatch-order.validator.js";
import { generateDispatchOrderPDF } from "./pdf/dispatch-order-pdf.service.js";

/**
 * Handler para listar dispatchOrders con paginación y filtros
 */
export const listDispatchOrdersHandler = async (
  req: Request<
    {},
    {},
    {},
    {
      clienteId?: string;
      estado?: EstadoDispatchOrder;
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
    page,
    search,
    estado,
    clienteId,
    vendedorId,
    fechaDesde,
    fechaHasta,
  } = req.query;
  const limit = 10;

  const { dispatchOrders, total } = await service.listDispatchOrders({
    page: page !== undefined ? Number(page) : 1,
    limit,
    search,
    estado,
    clienteId: clienteId !== undefined ? Number(clienteId) : undefined,
    vendedorId: vendedorId !== undefined ? Number(vendedorId) : undefined,
    fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
    fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
    organizationId,
  });

  res.status(200).json({
    data: dispatchOrders,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler para obtener una dispatch order por su secuencia
 */
export const getDispatchOrderBySecuenciaHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const dispatchOrder = await service.getDispatchOrderBySecuencia(
    Number(secuencia),
    organizationId,
  );

  res.status(200).json(dispatchOrder);
};

/**
 * Handler para actualizar una dispatchOrder en estado DRAFT
 * NOTA: Esta función está deshabilitada. Usar los endpoints de items individuales en su lugar.
 */
export const updateDispatchOrderHandler = async (
  req: Request<{ id: string }, {}, ActualizarDispatchOrderDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const dispatchOrder = await service.updateDispatchOrder(
    Number(id),
    data,
    organizationId,
  );

  res.status(200).json(dispatchOrder);
};

/**
 * Handler para emitir una dispatchOrder (DRAFT -> EMITTED)
 */
export const emitDispatchOrderHandler = async (
  req: Request<{ id: string }, {}, EmitirDispatchOrderDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const dispatchOrder = await service.emitInvoice(
    Number(id),
    organizationId,
    data,
  );

  res.status(200).json(dispatchOrder);
};

/**
 * Handler para despachar una dispatch order (EMITTED -> DISPATCHED)
 * Requiere documentos firmados
 */
export const dispatchOrderHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { secuencia } = req.params;
  const files = req.files as Express.Multer.File[];

  if (files.length === 0) {
    return res.status(400).json({
      message: "At least one document is required to dispatch",
    });
  }

  const result = await service.dispatchOrder(
    Number(secuencia),
    files,
    organizationId,
    userEmail,
  );

  res.status(200).json(result.dispatchOrder);
};

/**
 * Regenerates emitted dispatch PDF, replaces S3 auto PDF, emails warehouse managers.
 */
export const regenerateEmittedDispatchOrderPdfHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { secuencia } = req.params;

  const dispatchOrder = await service.regenerateEmittedDispatchOrderPdf(
    Number(secuencia),
    organizationId,
    userEmail,
  );

  res.status(200).json(dispatchOrder);
};

/**
 * Handler para listar documentos de una dispatch order
 */
export const listDispatchOrderDocumentsHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  // First get the dispatch order to get its internal ID
  const dispatchOrder = await service.getDispatchOrderBySecuencia(
    Number(secuencia),
    organizationId,
  );

  const documents = await documentService.listDocumentsForDocument(
    DocumentType.DISPATCH_ORDER,
    dispatchOrder.DOGId,
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
 * Handler para crear solo el encabezado de una dispatch order
 */
export const createDispatchOrderHeaderHandler = async (
  req: Request<{}, {}, CrearDispatchOrderHeaderDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);

  const data = req.body;

  const dispatchOrder = await service.createDispatchOrderHeader(
    data,
    organizationId,
    userEmail,
  );

  res.status(201).json(dispatchOrder);
};

/**
 * Handler para agregar un item a una dispatch order
 */
export const addDispatchOrderItemHandler = async (
  req: Request<{ id: string }, {}, AgregarDispatchOrderItemDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id } = req.params;
  const itemData = req.body;

  // Obtener el modo de salida de la dispatch order
  const dispatchOrder = await service.getDispatchOrderBySecuencia(
    Number(id),
    organizationId,
  );

  const modoSalida = itemData.DOUModoSalida;

  const items = await service.addDispatchOrderItem(
    Number(id),
    {
      ...itemData,
      DOULote: itemData.DOULote ?? undefined,
      DOUNroDocumento: itemData.DOUNroDocumento ?? undefined,
    },
    modoSalida,
    organizationId,
    userEmail,
  );

  res.status(201).json({ items });
};

/**
 * Handler para actualizar un item completo
 */
export const updateDispatchOrderItemHandler = async (
  req: Request<
    { id: string; itemId: string },
    {},
    ActualizarDispatchOrderItemDto
  >,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id, itemId } = req.params;
  const updateData = req.body;

  if (!updateData) {
    return res.status(400).json({ message: "No data to update" });
  }

  // Obtener la dispatch order para validar que existe
  const dispatchOrder = await service.getDispatchOrderBySecuencia(
    Number(id),
    organizationId,
  );

  const result = await service.updateDispatchOrderItem(
    Number(id),
    Number(itemId),
    updateData,
    organizationId,
    userEmail,
  );

  res.status(200).json({
    items: result.items,
    warnings: result.warnings,
  });
};

/**
 * Handler para eliminar un item de una dispatch order
 */
export const deleteDispatchOrderItemHandler = async (
  req: Request<{ id: string; itemId: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id, itemId } = req.params;

  await service.deleteDispatchOrderItem(
    Number(id),
    Number(itemId),
    organizationId,
  );

  res.status(204).send();
};

/**
 * Handler para eliminar una dispatchOrder en estado DRAFT
 */
export const deleteDispatchOrderHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteDispatchOrder(Number(id), organizationId);

  res.status(204).send();
};

/**
 * Handler para actualizar cantidad devuelta de un item (temporal para tiempo real)
 */
export const updateCantidadDevueltaHandler = async (
  req: Request<
    { itemId: string; secuencia: string },
    {},
    ActualizarCantidadDevueltaDto
  >,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { secuencia, itemId } = req.params;
  const { DOUCantidadDevuelta } = req.body;

  const items = await service.updateCantidadDevuelta(
    Number(secuencia),
    Number(itemId),
    DOUCantidadDevuelta,
    organizationId,
    userEmail,
  );

  res.status(200).json({ items });
};

/**
 * Handler para obtener movimientos de salida de un dispatch order
 */
export const obtenerMovimientosSalidaHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const movimientos = await service.obtenerMovimientosSalida(
    Number(secuencia),
    organizationId,
  );

  res.status(200).json({ movimientos });
};

/**
 * Handler para generar y descargar PDF de una dispatch order
 */
export const generatePDFHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  // Generate PDF
  const pdfBuffer = await generateDispatchOrderPDF(
    Number(secuencia),
    organizationId,
  );

  // Get dispatch order for filename
  const dispatchOrder = await service.getDispatchOrderBySecuencia(
    Number(secuencia),
    organizationId,
  );

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dispatch-order-${String(dispatchOrder.DOGNro)}.pdf"`,
  );
  res.setHeader("Content-Length", pdfBuffer.length.toString());

  // Send PDF buffer
  res.send(pdfBuffer);
};

/**
 * Handler para obtener items disponibles para devolución
 */
export const obtenerItemsDisponiblesDevolucionHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const items = await service.obtenerItemsDisponiblesParaDevolucion(
    Number(secuencia),
    organizationId,
  );

  res.status(200).json({ items });
};

/**
 * Handler para crear devoluciones
 */
export const crearDevolucionesHandler = async (
  req: Request<{ secuencia: string }, {}, CrearDevolucionesDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { secuencia } = req.params;
  const { devoluciones } = req.body;

  const items = await service.crearDevoluciones(
    Number(secuencia),
    devoluciones,
    organizationId,
    userEmail,
  );

  res.status(201).json({ items });
};

/**
 * Handler para anular dispatch order
 */
export const anularDispatchOrderHandler = async (
  req: Request<{ secuencia: string }, {}, AnularDispatchOrderDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { secuencia } = req.params;
  const { razonAnulacion } = req.body;

  const dispatchOrder = await service.anularDispatchOrder(
    Number(secuencia),
    organizationId,
    userEmail,
    razonAnulacion,
  );

  res.status(200).json(dispatchOrder);
};
