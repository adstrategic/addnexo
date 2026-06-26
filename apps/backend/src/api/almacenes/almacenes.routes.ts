import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./almacenes.controller.js";
import {
  actualizarAlmacenSchema,
  almacenSchema,
} from "./almacenes.validator.js";

const router: Router = Router();

// GET /api/v1/almacenes - List all warehouses
router.get("/", controller.listAlmacenesHandler);

// GET /api/v1/almacenes/:secuencia - Get warehouse by sequence
router.get("/:secuencia", controller.getAlmacenBySecuenciaHandler);

// POST /api/v1/almacenes - Create warehouse
router.post(
  "/",
  validateRequest(almacenSchema),
  controller.createAlmacenHandler,
);

// PUT /api/v1/almacenes/:id - Update warehouse
router.patch(
  "/:id",
  validateRequest(actualizarAlmacenSchema),
  controller.updateAlmacenHandler,
);

// DELETE /api/v1/almacenes/:id - Delete warehouse
router.delete("/:id", controller.deleteAlmacenHandler);

export default router;
