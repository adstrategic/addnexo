import { Router } from "express";
import { validateRequest } from "../../core/validateRequest.js";
import {
  updateKardexSettingsSchema,
  getLotesDisponiblesSchema,
} from "./kardex.validator.js";
import * as controller from "./kardex.controller.js";

const router: Router = Router();

router.get("/", controller.listKardexHandler);

// Nuevo endpoint para obtener lotes disponibles por producto y almacén
router.get("/lotes-disponibles", controller.getLotesDisponiblesHandler);

router.get("/:secuencia", controller.getKardexBySecuenciaHandler);

router.patch(
  "/:id",
  validateRequest(updateKardexSettingsSchema),
  controller.updateKardexSettingsHandler,
);

router.get("/:id/lotes", controller.listKardexLotesHandler);

export default router;
