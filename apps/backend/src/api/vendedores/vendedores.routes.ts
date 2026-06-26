import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./vendedores.controller.js";
import {
  actualizarVendedorSchema,
  crearVendedorSchema,
} from "./vendedores.validator.js";

const router: Router = Router();

// GET /api/inventario/vendedores - Listar todos los vendedores
router.get("/", controller.listVendedoresHandler);

// GET /api/inventario/vendedores/:secuencia - Obtener un vendedor por su secuencia
router.get("/:secuencia", controller.getVendedorBySecuenciaHandler);

// POST /api/inventario/vendedores - Crear un nuevo vendedor
router.post(
  "/",
  validateRequest(crearVendedorSchema),
  controller.createVendedorHandler,
);

// PUT /api/inventario/vendedores/:id - Actualizar un vendedor existente
router.patch(
  "/:id",
  validateRequest(actualizarVendedorSchema),
  controller.updateVendedorHandler,
);

// DELETE /api/inventario/vendedores/:id - Eliminar un vendedor
router.delete("/:id", controller.deleteVendedorHandler);

export default router;
