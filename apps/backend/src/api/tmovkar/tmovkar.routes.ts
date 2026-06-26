import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./tmovkar.controller.js";
import {
  actualizarTipoMovimientoSchema,
  tipoMovimientoSchema,
} from "./tmovkar.validator.js";

const router: Router = Router();

router.get("/", controller.listTiposMovimientoHandler);
router.get("/available-purposes", controller.getAvailablePurposesHandler);
router.get("/next-available-class", controller.getNextAvailableClassHandler);
router.get("/:secuencia", controller.getTipoMovimientoBySecuenciaHandler);
router.post(
  "/",
  validateRequest(tipoMovimientoSchema),
  controller.createTipoMovimientoHandler,
);
router.patch(
  "/:id",
  validateRequest(actualizarTipoMovimientoSchema),
  controller.updateTipoMovimientoHandler,
);
router.delete("/:id", controller.deleteTipoMovimientoHandler);

export default router;
