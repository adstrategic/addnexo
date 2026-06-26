import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./unidades.controller.js";
import {
  actualizarUnidadMedidaSchema,
  unidadMedidaSchema,
} from "./unidades.validator.js";

const router: Router = Router();

// GET /api/v1/unidades - Listar todas las unidades
router.get("/", controller.listUnidadesHandler);

// GET /api/v1/unidades/:id - Obtener una unidad por su ID
router.get("/:secuencia", controller.getUnidadBySecuenciaHandler);

// POST /api/v1/unidades - Crear una nueva unidad
router.post(
  "/",
  validateRequest(unidadMedidaSchema),
  controller.createUnidadHandler,
);

// PUT /api/v1/unidades/:id - Actualizar una unidad
router.patch(
  "/:id",
  validateRequest(actualizarUnidadMedidaSchema),
  controller.updateUnidadHandler,
);

// DELETE /api/v1/unidades/:id - Eliminar una unidad
router.delete("/:id", controller.deleteUnidadHandler);

// // GET /api/v1/unidades/:id/productos - Obtener productos de una unidad específica
// router.get("/:id/productos", controller.getProductosByUnidadHandler);

export default router;
