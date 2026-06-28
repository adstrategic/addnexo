import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import { uploadMultiple } from "../../middleware/upload.middleware.js";
import * as controller from "./dispatch-order.controller.js";
import {
  actualizarCantidadDevueltaSchema,
  actualizarDispatchOrderItemSchema,
  actualizarDispatchOrderSchema,
  agregarDispatchOrderItemSchema,
  anularDispatchOrderSchema,
  crearDevolucionesSchema,
  crearDispatchOrderHeaderSchema,
  emitirDispatchOrderSchema,
} from "./dispatch-order.validator.js";

const router: Router = Router();

// Mount-level requireRole(["admin", "warehouse_manager"]) is applied in protected.routes.ts.
// Per-verb requirePermission below enforces the action-level split: warehouse_manager has
// create/read/update/dispatch; emit, delete and void (anular) are admin-only.

router.get(
  "/",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.listDispatchOrdersHandler,
);

router.get(
  "/:secuencia",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.getDispatchOrderBySecuenciaHandler,
);

router.put(
  "/:id",
  requirePermission({ dispatchOrder: ["update"] }),
  validateRequest(actualizarDispatchOrderSchema),
  controller.updateDispatchOrderHandler,
);

router.patch(
  "/:id/emit",
  requirePermission({ dispatchOrder: ["emit"] }),
  validateRequest(emitirDispatchOrderSchema),
  controller.emitDispatchOrderHandler,
);

router.post(
  "/:secuencia/dispatch",
  requirePermission({ dispatchOrder: ["dispatch"] }),
  uploadMultiple,
  controller.dispatchOrderHandler,
);

router.post(
  "/:secuencia/regenerate-emitted-pdf",
  requirePermission({ dispatchOrder: ["create"] }),
  controller.regenerateEmittedDispatchOrderPdfHandler,
);

router.get(
  "/:secuencia/documents",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.listDispatchOrderDocumentsHandler,
);

router.get(
  "/documents/:documentId/download",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.getDocumentDownloadUrlHandler,
);

router.delete(
  "/documents/:documentId",
  requirePermission({ dispatchOrder: ["delete"] }),
  controller.deleteDocumentHandler,
);

router.delete(
  "/:id",
  requirePermission({ dispatchOrder: ["delete"] }),
  controller.deleteDispatchOrderHandler,
);

router.post(
  "/headers",
  requirePermission({ dispatchOrder: ["create"] }),
  validateRequest(crearDispatchOrderHeaderSchema),
  controller.createDispatchOrderHeaderHandler,
);

router.post(
  "/:id/items",
  requirePermission({ dispatchOrder: ["create"] }),
  validateRequest(agregarDispatchOrderItemSchema),
  controller.addDispatchOrderItemHandler,
);

router.put(
  "/:id/items/:itemId",
  requirePermission({ dispatchOrder: ["update"] }),
  validateRequest(actualizarDispatchOrderItemSchema),
  controller.updateDispatchOrderItemHandler,
);

router.delete(
  "/:id/items/:itemId",
  requirePermission({ dispatchOrder: ["delete"] }),
  controller.deleteDispatchOrderItemHandler,
);

router.patch(
  "/:secuencia/items/:itemId/cantidad-devuelta",
  requirePermission({ dispatchOrder: ["update"] }),
  validateRequest(actualizarCantidadDevueltaSchema),
  controller.updateCantidadDevueltaHandler,
);

router.get(
  "/:secuencia/movimientos-salida",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.obtenerMovimientosSalidaHandler,
);

router.get(
  "/:secuencia/pdf",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.generatePDFHandler,
);

router.get(
  "/:secuencia/devoluciones/items-disponibles",
  requirePermission({ dispatchOrder: ["read"] }),
  controller.obtenerItemsDisponiblesDevolucionHandler,
);

router.post(
  "/:secuencia/devoluciones",
  requirePermission({ dispatchOrder: ["create"] }),
  validateRequest(crearDevolucionesSchema),
  controller.crearDevolucionesHandler,
);

router.patch(
  "/:secuencia/anular",
  requirePermission({ dispatchOrder: ["void"] }),
  validateRequest(anularDispatchOrderSchema),
  controller.anularDispatchOrderHandler,
);

export default router;
