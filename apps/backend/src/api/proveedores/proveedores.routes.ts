import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./proveedores.controller.js";
import {
  actualizarProveedorSchema,
  crearProveedorSchema,
} from "./proveedores.validator.js";

const router: Router = Router();

// GET /api/v1/proveedores - Obtener lista paginada de proveedores
router.get("/", controller.listProveedoresHandler);

// GET /api/v1/proveedores/:secuencia - Obtener un proveedor por su secuencia
router.get("/:secuencia", controller.getProveedorBySecuenciaHandler);

// POST /api/v1/proveedores - Crear un nuevo proveedor
router.post(
  "/",
  validateRequest(crearProveedorSchema),
  controller.createProveedorHandler,
);

// PUT /api/v1/proveedores/:id - Actualizar un proveedor existente
router.patch(
  "/:id",
  validateRequest(actualizarProveedorSchema.body),
  controller.updateProveedorHandler,
);

// DELETE /api/v1/proveedores/:id - Eliminar un proveedor
router.delete("/:id", controller.deleteProveedorHandler);

export default router;
