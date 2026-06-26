import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./catalogo.controller.js";
import {
  actualizarProductoSchema,
  crearProductoSchema,
} from "./catalogo.validator.js";

const router: Router = Router();

// GET /api/v1/productos - Listar todos los productos con paginación y búsqueda
router.get("/", controller.listProductosHandler);

// Endpoint para obtener un producto por su secuencia
router.get("/:secuencia", controller.getProductoHandler);

// Endpoint para crear un nuevo producto
router.post(
  "/",
  validateRequest(crearProductoSchema),
  controller.createProductoHandler,
);

// Endpoint para actualizar un producto existente
router.patch(
  "/:id",
  validateRequest(actualizarProductoSchema.body),
  controller.updateProductoHandler,
);

// Endpoint para eliminar un producto
router.delete("/:id", controller.deleteProductoHandler);

export default router;
