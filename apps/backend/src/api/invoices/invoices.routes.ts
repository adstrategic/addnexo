import { Router } from "express";

import { getDocumentByIdSchema } from "../documents/documents.validator.js";
import * as controller from "./invoices.controller.js";
import {
  crearFacturaSchema,
  getFacturaByIdSchema,
  getFacturaBySecuenciaSchema,
  getStatementPdfSchema,
  listFacturasSchema,
  registrarNotaCreditoConDevolucionSchema,
  registrarNotaCreditoSchema,
  registrarNotaDebitoSchema,
  registrarPagoSchema,
  sendStatementSchema,
} from "./invoices.validator.js";
import { validateRequest } from "../../core/validateRequest.js";

const router: Router = Router();

// GET /api/inventario/facturas - Listar todas las facturas
router.get(
  "/",

  controller.listFacturasHandler,
);

// GET /api/inventario/facturas/statement/clients-with-outstanding - Clientes con saldo y factura vencida
router.get(
  "/statement/clients-with-outstanding",

  controller.getClientsWithOutstandingBalanceHandler,
);

// GET /api/v1/invoices/statement/pdf - Descargar PDF de statement
router.get("/statement/pdf", controller.downloadStatementPDFHandler);

// POST /api/inventario/facturas/statement/send - Enviar statement por email
router.post(
  "/statement/send",

  validateRequest(sendStatementSchema),
  controller.sendStatementHandler,
);

// POST /api/inventario/facturas/:id/pagos - Registrar un pago
router.post(
  "/:id/pagos",

  validateRequest(registrarPagoSchema),
  controller.registrarPagoHandler,
);

// POST /api/inventario/facturas/:id/notas-debito - Registrar una nota débito
router.post(
  "/:id/notas-debito",

  validateRequest(registrarNotaDebitoSchema),
  controller.registrarNotaDebitoHandler,
);

// POST /api/inventario/facturas/:id/notas-credito - Registrar una nota crédito simple
router.post(
  "/:id/notas-credito",

  validateRequest(registrarNotaCreditoSchema),
  controller.registrarNotaCreditoHandler,
);

// GET /api/inventario/facturas/:id/items-disponibles-devolucion - Obtener items disponibles para devolución
router.get(
  "/:id/items-disponibles-devolucion",

  controller.obtenerItemsFacturaParaDevolucionHandler,
);

// POST /api/inventario/facturas/:id/notas-credito-con-devolucion - Registrar una nota crédito con devolución
router.post(
  "/:id/notas-credito-con-devolucion",

  validateRequest(registrarNotaCreditoConDevolucionSchema),
  controller.registrarNotaCreditoConDevolucionHandler,
);

// GET /api/inventario/facturas/:secuencia/movimientos-cxc - Obtener movimientos CXC
router.get(
  "/:id/movimientos-cxc",

  controller.getMovimientosCXCHandler,
);

// GET /api/inventario/facturas/:secuencia/pdf - Generar y descargar PDF de factura
router.get(
  "/:secuencia/pdf",

  controller.generatePDFHandler,
);

// GET /api/inventario/facturas/:secuencia - Obtener una factura por su secuencia
router.get(
  "/:secuencia",

  controller.getFacturaBySecuenciaHandler,
);

// POST /api/inventario/facturas - Crear una factura
router.post(
  "/",

  validateRequest(crearFacturaSchema),
  controller.createFacturaHandler,
);

// GET /api/inventario/facturas/documents/:documentId/download - Obtener URL firmada para descargar documento
router.get(
  "/documents/:documentId/download",

  validateRequest(getDocumentByIdSchema),
  controller.getDocumentDownloadUrlHandler,
);

// DELETE /api/inventario/facturas/documents/:documentId - Eliminar un documento
router.delete("/documents/:documentId", controller.deleteDocumentHandler);

export default router;
