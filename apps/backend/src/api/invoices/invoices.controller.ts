import type { Request, Response } from "express";

import { EstadoFactura } from "@repo/db";

import { getContext } from "../../middleware/context.middleware.js";
import { emailStatementQueue } from "../../queue/queues.js";
import * as documentService from "../documents/documents.service.js";
import * as service from "./invoices.service.js";
import {
  CrearFacturaDto,
  getStatementPdfSchema,
  RegistrarNotaCreditoConDevolucionDto,
  RegistrarNotaCreditoDto,
  RegistrarNotaDebitoDto,
  RegistrarPagoDto,
  SendStatementDto,
} from "./invoices.validator.js";
import { generateInvoicePDF } from "./pdf/invoice-pdf.service.js";
import { generateStatementPDF } from "./pdf/statement-pdf.service.js";

/**
 * Handler para listar facturas con paginación y filtros
 */
export const listFacturasHandler = async (
  req: Request<
    {},
    {},
    {},
    {
      clienteId?: string;
      dateFrom?: string;
      dateTo?: string;
      estado?: EstadoFactura;
      page?: string;
      search?: string;
      vendedorId?: string;
    }
  >,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page, search, estado, clienteId, vendedorId, dateFrom, dateTo } =
    req.query;

  const limit = 10;

  const { facturas, total } = await service.listFacturas({
    page: Number(page),
    limit,
    search,
    estado,
    clienteId: Number(clienteId),
    vendedorId: Number(vendedorId),
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
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
export const getFacturaBySecuenciaHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const factura = await service.getFacturaBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!factura) {
    return res.status(404).json({ message: "Invoice not found." });
  }

  res.status(200).json(factura);
};

/**
 * Handler para crear una nueva factura
 */
export const createFacturaHandler = async (
  req: Request<{}, {}, CrearFacturaDto>,
  res: Response,
) => {
  const { userEmail } = getContext(req);
  const data = req.body;

  const factura = await service.createFactura(data, userEmail);

  res.status(200).json(factura);
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

/**
 * Handler para registrar un pago en una factura
 */
export const registrarPagoHandler = async (
  req: Request<{ id: string }, {}, RegistrarPagoDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const result = await service.registrarPago(
    Number(id),
    data,
    organizationId,
    userEmail,
  );

  res.status(200).json(result);
};

/**
 * Handler para registrar una nota débito en una factura
 */
export const registrarNotaDebitoHandler = async (
  req: Request<{ id: string }, {}, RegistrarNotaDebitoDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const result = await service.registrarNotaDebito(
    Number(id),
    data,
    organizationId,
    userEmail,
  );

  res.status(200).json(result);
};

/**
 * Handler para registrar una nota crédito simple en una factura
 */
export const registrarNotaCreditoHandler = async (
  req: Request<{ id: string }, {}, RegistrarNotaCreditoDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const result = await service.registrarNotaCredito(
    Number(id),
    data,
    organizationId,
    userEmail,
  );

  res.status(200).json(result);
};

/**
 * Handler para obtener items disponibles para devolución de una factura
 */
export const obtenerItemsFacturaParaDevolucionHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  const result = await service.obtenerItemsFacturaParaDevolucion(
    Number(id),
    organizationId,
  );

  res.status(200).json(result);
};

/**
 * Handler para registrar una nota crédito con devolución de inventario
 */
export const registrarNotaCreditoConDevolucionHandler = async (
  req: Request<{ id: string }, {}, RegistrarNotaCreditoConDevolucionDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const result = await service.registrarNotaCreditoConDevolucion(
    Number(id),
    data,
    organizationId,
    userEmail,
  );

  res.status(200).json(result);
};

/**
 * Handler para obtener movimientos CXC de una factura
 */
export const getMovimientosCXCHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  const result = await service.getMovimientosCXC(Number(id), organizationId);

  res.status(200).json(result);
};

/**
 * Handler para generar y descargar PDF de una factura
 */
export const generatePDFHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(Number(secuencia), organizationId);

  // Get invoice for filename
  const factura = await service.getFacturaBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!factura) {
    return res.status(404).json({ message: "Invoice not found." });
  }

  // Set response headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${factura.FGNro}.pdf"`,
  );
  res.setHeader("Content-Length", pdfBuffer.length.toString());

  // Send PDF buffer
  res.send(pdfBuffer);
};

/**
 * Handler para obtener IDs de clientes elegibles para statement:
 * al menos una factura con saldo pendiente (estado ACTIVE u OVERDUE),
 * independientemente de si está vencida.
 */
export const getClientsWithOutstandingBalanceHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const clienteIds =
    await service.getClienteIdsWithOutstandingBalance(organizationId);
  res.status(200).json({ clienteIds });
};

/**
 * Handler para descargar PDF de statement de un cliente
 */
export const downloadStatementPDFHandler = async (
  req: Request<{}, {}, {}, { clienteId: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { clienteId } = req.query;

  const { rows, clientName } = await service.getStatementData(
    Number(clienteId),
    organizationId,
  );

  if (rows.length === 0) {
    return res.status(400).json({
      message: "No invoices with balance found for this client.",
    });
  }

  const pdfBuffer = await generateStatementPDF(
    Number(clienteId),
    organizationId,
  );
  const safeName = clientName.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `statement-${safeName}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", pdfBuffer.length.toString());
  res.send(pdfBuffer);
};

/**
 * Handler para enviar statement por email a un cliente
 */
export const sendStatementHandler = async (
  req: Request<{}, {}, SendStatementDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { clienteId, email } = req.body;

  const hasOutstandingBalance = await service.clientHasOutstandingBalanceInvoices(
    clienteId,
    organizationId,
  );
  if (!hasOutstandingBalance) {
    return res.status(400).json({
      message:
        "Statement cannot be sent: this customer has no invoices with an outstanding balance.",
    });
  }

  const { rows } = await service.getStatementData(clienteId, organizationId);
  if (rows.length === 0) {
    return res.status(400).json({
      message: "No invoices with balance found for this client.",
    });
  }

  // Enqueue is awaited here so a Redis failure surfaces as a 500, not a silent drop.
  const job = await emailStatementQueue.add("send-statement", {
    clienteId,
    organizationId,
    email,
  });

  console.info(
    `[statement] enqueued email-statement job ${String(job.id)} clienteId=${clienteId} email=${email}. ` +
      `Delivery requires the statement worker process to be running (see worker.ts / dev:worker).`,
  );

  return res.status(202).json({ message: "Statement queued for delivery." });
};
