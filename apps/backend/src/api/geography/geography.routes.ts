import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import * as controller from "./geography.controller.js";
import * as schemas from "./geography.validator.js";

const router: Router = Router();

// --- Rutas de Búsqueda ---
router.get("/ciudades/search", controller.searchCiudadesHandler);
router.get("/estados", controller.searchEstadosHandler);
router.get("/paises", controller.searchPaisesHandler);

// --- Rutas de Países ---
router.post(
  "/paises",
  validateRequest(schemas.paisSchema),
  controller.createPaisHandler,
);

// --- Rutas de Estados (anidadas bajo país) ---
router.post(
  "/estados",
  // "/paises/:paisId/estados",
  validateRequest(schemas.estadoSchema),
  controller.createEstadoHandler,
);

// --- Rutas de Ciudades (anidadas bajo estado) ---

// --- Rutas de Listado ---
router.get("/ciudades", controller.listCiudadesConRelacionesHandler);

router.post(
  "/ciudades",
  // "/estados/:estadoId/ciudades",
  validateRequest(schemas.ciudadSchema),
  controller.createCiudadHandler,
);

// NOTA: Los endpoints de PUT y DELETE usan IDs directos para simplicidad.
// router.put('/paises/:id', ...);
// router.put('/estados/:id', ...);
// router.put('/ciudades/:id', ...);

export default router;
