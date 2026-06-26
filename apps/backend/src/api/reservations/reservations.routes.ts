import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./reservations.controller.js";
import {
  createReservationSchema,
  releaseReservationSchema,
} from "./reservations.validator.js";

const router: Router = Router();

// GET /api/inventario/reservations - List reservations
router.get("/", controller.listReservationsHandler);

// POST /api/inventario/reservations - Create reservation
router.post(
  "/",
  validateRequest(createReservationSchema),
  controller.createReservationHandler,
);

// GET /api/inventario/reservations/:id - Get reservation by ID
router.get("/:id", controller.getReservationByIdHandler);

// PATCH /api/inventario/reservations/:id/release - Release reservation
router.patch(
  "/:id/release",
  validateRequest(releaseReservationSchema),
  controller.releaseReservationHandler,
);

// GET /api/inventario/reservations/by-lote/:kardexLoteId - Get reserved quantity by lote
router.get(
  "/by-lote/:kardexLoteId",
  controller.getReservedQuantityByLoteHandler,
);

export default router;
