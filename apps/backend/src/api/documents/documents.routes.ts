import { Router } from "express";

import { uploadMultiple } from "../../middleware/upload.middleware.js";
import * as controller from "./documents.controller.js";

const router: Router = Router();

// GET /api/inventario/documents/:type - Listar documentos agrupados por tipo
router.get("/:type", controller.listDocumentsByTypeHandler);

// GET /api/inventario/documents/:documentId/download - Obtener URL firmada para descargar documento
router.get("/:documentId/download", controller.getDocumentDownloadUrlHandler);

// GET /api/inventario/documents/:type/:sequence - Listar documentos de un documento específico
router.get("/:type/:sequence", controller.listDocumentsForDocumentHandler);

// POST /api/inventario/documents/:type/:sequence - Subir documentos
router.post(
  "/:type/:sequence",
  uploadMultiple,
  controller.uploadDocumentHandler,
);

// DELETE /api/v1/documents/:documentId - Eliminar un documento
router.delete("/:documentId", controller.deleteDocumentHandler);

export default router;
