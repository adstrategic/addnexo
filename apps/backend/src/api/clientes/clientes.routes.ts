import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./clientes.controller.js";
import {
  actualizarClienteSchema,
  crearClienteSchema,
} from "./clientes.validator.js";

const router: Router = Router();

// GET /api/inventario/clientes - Listar todos los clientes
router.get("/", controller.listClientesHandler);

// GET /api/inventario/clientes/:secuencia - Obtener un cliente por su secuencia
router.get("/:secuencia", controller.getClienteBySecuenciaHandler);

// POST /api/inventario/clientes - Crear un nuevo cliente
router.post(
  "/",
  validateRequest(crearClienteSchema),
  controller.createClienteHandler,
);

// PUT /api/inventario/clientes/:id - Actualizar un cliente existente
router.patch(
  "/:id",
  validateRequest(actualizarClienteSchema),
  controller.updateClienteHandler,
);

// DELETE /api/inventario/clientes/:id - Eliminar un cliente
router.delete("/:id", controller.deleteClienteHandler);

export default router;
