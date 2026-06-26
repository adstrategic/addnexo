import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
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

// Access control is enforced at mount: requireRole in protected.routes.ts

router.get("/", controller.listDispatchOrdersHandler);

router.get("/:secuencia", controller.getDispatchOrderBySecuenciaHandler);

router.put(
  "/:id",
  validateRequest(actualizarDispatchOrderSchema),
  controller.updateDispatchOrderHandler,
);

router.patch(
  "/:id/emit",
  validateRequest(emitirDispatchOrderSchema),
  controller.emitDispatchOrderHandler,
);

router.post(
  "/:secuencia/dispatch",
  uploadMultiple,
  controller.dispatchOrderHandler,
);

router.post(
  "/:secuencia/regenerate-emitted-pdf",
  controller.regenerateEmittedDispatchOrderPdfHandler,
);

router.get(
  "/:secuencia/documents",
  controller.listDispatchOrderDocumentsHandler,
);

router.get(
  "/documents/:documentId/download",
  controller.getDocumentDownloadUrlHandler,
);

router.delete("/documents/:documentId", controller.deleteDocumentHandler);

router.delete("/:id", controller.deleteDispatchOrderHandler);

router.post(
  "/headers",
  validateRequest(crearDispatchOrderHeaderSchema),
  controller.createDispatchOrderHeaderHandler,
);

router.post(
  "/:id/items",
  validateRequest(agregarDispatchOrderItemSchema),
  controller.addDispatchOrderItemHandler,
);

router.put(
  "/:id/items/:itemId",
  validateRequest(actualizarDispatchOrderItemSchema),
  controller.updateDispatchOrderItemHandler,
);

router.delete("/:id/items/:itemId", controller.deleteDispatchOrderItemHandler);

router.patch(
  "/:secuencia/items/:itemId/cantidad-devuelta",
  validateRequest(actualizarCantidadDevueltaSchema),
  controller.updateCantidadDevueltaHandler,
);

router.get(
  "/:secuencia/movimientos-salida",
  controller.obtenerMovimientosSalidaHandler,
);

router.get("/:secuencia/pdf", controller.generatePDFHandler);

router.get(
  "/:secuencia/devoluciones/items-disponibles",
  controller.obtenerItemsDisponiblesDevolucionHandler,
);

router.post(
  "/:secuencia/devoluciones",
  validateRequest(crearDevolucionesSchema),
  controller.crearDevolucionesHandler,
);

router.patch(
  "/:secuencia/anular",
  validateRequest(anularDispatchOrderSchema),
  controller.anularDispatchOrderHandler,
);

export default router;
