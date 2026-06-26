import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./movkar.controller.js";
import {
  actualizarCostoCeroSchema,
  crearMovimientosBulkSchema,
  crearMovimientoSchema,
} from "./movkar.validator.js";

const router: Router = Router();

// GET /api/movkar - Listar movimientos con filtros y paginación
router.get("/", controller.listarMovimientosHandler);

// GET /api/movkar/costo-promedio - Obtener costo promedio del kardex
router.get("/costo-promedio", controller.obtenerCostoPromedioHandler);

// GET /api/movkar/ultimo-lote - Obtener último lote disponible
router.get("/ultimo-lote", controller.obtenerUltimoLoteHandler);

// POST /api/movkar/bulk - Crear múltiples movimientos en una transacción
router.post(
  "/bulk",
  validateRequest(crearMovimientosBulkSchema),
  controller.crearMovimientosBulkHandler,
);

// GET /api/movkar/:secuencial - Obtener movimiento por secuencial
router.get("/:secuencial", controller.obtenerMovimientoPorSecuencialHandler);

// PATCH /api/movkar/:id - Actualizar costo de entrada temporal cero
router.patch(
  "/:id",
  validateRequest(actualizarCostoCeroSchema),
  controller.actualizarCostoCeroHandler,
);

// POST /api/movkar - Crear nuevo movimiento
router.post(
  "/",
  validateRequest(crearMovimientoSchema),
  controller.crearMovimientoHandler,
);

export default router;
