import { Router } from "express";
import * as controller from "./mov-cxc.controller.js";

const router: Router = Router();

// GET /api/inventario/mov-cxc/credit-notes - Listar credit notes
router.get("/credit-notes", controller.listCreditNotesHandler);

// GET /api/inventario/mov-cxc/debit-notes - Listar debit notes
router.get("/debit-notes", controller.listDebitNotesHandler);

// GET /api/inventario/mov-cxc/credit-notes/:secuencia - Obtener credit note por secuencia
router.get(
  "/credit-notes/:secuencia",
  controller.getCreditNoteBySecuenciaHandler,
);

// GET /api/inventario/mov-cxc/debit-notes/:secuencia - Obtener debit note por secuencia
router.get(
  "/debit-notes/:secuencia",
  controller.getDebitNoteBySecuenciaHandler,
);

export default router;
