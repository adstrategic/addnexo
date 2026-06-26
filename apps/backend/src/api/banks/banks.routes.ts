import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./banks.controller.js";
import { createBankSchema, updateBankSchema } from "./banks.validator.js";

const router: Router = Router();

// GET /api/inventario/banks - List all banks
router.get("/", controller.listBanksHandler);

// GET /api/inventario/banks/:secuencia - Get bank by sequence
router.get("/:secuencia", controller.getBankBySequenceHandler);

// POST /api/inventario/banks - Create bank
router.post(
  "/",
  validateRequest(createBankSchema),
  controller.createBankHandler,
);

// PUT /api/inventario/banks/:secuencia - Update bank
router.put(
  "/:secuencia",
  validateRequest(updateBankSchema),
  controller.updateBankHandler,
);

// DELETE /api/inventario/banks/:secuencia - Delete bank
router.delete("/:secuencia", controller.deleteBankHandler);

export default router;
