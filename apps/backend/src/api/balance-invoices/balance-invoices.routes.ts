import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./balance-invoices.controller.js";
import {
  actualizarSaldosFacturaItemSchema,
  actualizarSaldosFacturaSchema,
  agregarSaldosFacturaItemSchema,
  crearSaldosFacturaHeaderSchema,
} from "./balance-invoices.validator.js";

const router: Router = Router();

// GET /api/inventario/facturas - Listar todas las facturas
router.get("/", controller.listSaldosFacturasHandler);

// GET /api/inventario/facturas/siguiente-numero - Obtener el siguiente número de factura
router.get("/siguiente-numero", controller.getSiguienteNumeroFacturaHandler);

// GET /api/inventario/facturas/:secuencia - Obtener una factura por su secuencia
router.get("/:secuencia", controller.getSaldosFacturaBySecuenciaHandler);

// PUT /api/inventario/facturas/:id - Actualizar una factura en estado DRAFT
// NOTA: Esta ruta está deshabilitada. Usar los endpoints de items individuales en su lugar.
router.put(
  "/:id",

  validateRequest(actualizarSaldosFacturaSchema),
  controller.updateSaldosFacturaHandler,
);

// GET /api/inventario/facturas/:secuencia/documents - Listar documentos de una factura
router.get(
  "/:secuencia/documents",

  controller.listFacturaDocumentsHandler,
);

// GET /api/inventario/facturas/documents/:documentId/download - Obtener URL firmada para descargar documento
router.get(
  "/documents/:documentId/download",
  controller.getDocumentDownloadUrlHandler,
);

// DELETE /api/inventario/facturas/documents/:documentId - Eliminar un documento
router.delete("/documents/:documentId", controller.deleteDocumentHandler);

// DELETE /api/inventario/facturas/:id - Eliminar una factura en estado DRAFT
router.delete("/:id", controller.deleteSaldosFacturaHandler);

// ===== NUEVAS RUTAS PARA PERSISTENCIA EN TIEMPO REAL =====

// POST /api/inventario/facturas/headers - Crear solo el encabezado de una factura
router.post(
  "/headers",
  validateRequest(crearSaldosFacturaHeaderSchema),
  controller.createSaldosFacturaHeaderHandler,
);

// POST /api/inventario/facturas/:id/items - Agregar un item a una factura
router.post(
  "/:id/items",
  validateRequest(agregarSaldosFacturaItemSchema),
  controller.addSaldosFacturaItemHandler,
);

// PUT /api/inventario/facturas/:id/items/:itemId - Actualizar un item completo
router.put(
  "/:id/items/:itemId",
  validateRequest(actualizarSaldosFacturaItemSchema),
  controller.updateSaldosFacturaItemHandler,
);

// GET /api/inventario/facturas/:secuencia/movimientos-salida - Obtener movimientos de salida
// Nota: Esta ruta se mantiene para uso futuro
// router.get(
//   "/:secuencia/movimientos-salida",
//   validateRequest({ params: getFacturaBySecuenciaSchema }),
//   controller.obtenerMovimientosSalidaHandler
// );

export default router;
