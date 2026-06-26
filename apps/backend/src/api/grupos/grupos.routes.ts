import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./grupos.controller.js";
import { actualizarGrupoSchema, crearGrupoSchema } from "./grupos.validator.js";

const router: Router = Router();

// GET /api/v1/grupos - Listar todos los grupos
router.get("/", controller.listGruposHandler);

// GET /api/v1/grupos/:secuencia - Obtener un grupo por su ID
router.get("/:secuencia", controller.getGrupoBySecuenciaHandler);

// GET /api/v1/grupos/siguiente-numero - Obtener el siguiente número de grupo disponible
router.get("/siguiente-numero", controller.getSiguienteNumeroGrupoHandler);

// GET /api/v1/grupos/:id/productos - Obtener productos de un grupo específico
// router.get(
//   "/:id/productos",
//   validateRequest({ query: listProductosByGrupoSchema }),
//   controller.getProductosByGrupoHandler,
// );

// POST /api/v1/grupos - Crear un nuevo grupo
router.post(
  "/",
  validateRequest(crearGrupoSchema),
  controller.createGrupoHandler,
);

// PUT /api/v1/grupos/:id - Actualizar un grupo existente
router.patch(
  "/:id",
  validateRequest(actualizarGrupoSchema),
  controller.updateGrupoHandler,
);

// DELETE /api/v1/grupos/:id - Eliminar un grupo
router.delete("/:id", controller.deleteGrupoHandler);

export default router;
