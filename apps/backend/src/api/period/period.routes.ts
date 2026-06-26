import { Router } from "express";

import { validateRequest } from "../../core/validateRequest.js";
import { requireRole } from "../../middleware/auth.middleware.js";
import * as controller from "./period.controller.js";
import { closePeriodSchema, setActiveSchema } from "./period.validator.js";

const router: Router = Router();

router.get("/available", controller.listAvailablePeriodsHandler);
router.get("/active", controller.getActivePeriodHandler);
router.post(
  "/active",
  validateRequest(setActiveSchema),
  controller.setActivePeriodHandler,
);
router.get("/status", controller.getClosingStatusHandler);
router.get("/close/validate", controller.validatePreCloseHandler);
router.post(
  "/close",
  requireRole(["owner", "admin"]),
  validateRequest(closePeriodSchema),
  controller.closePeriodHandler,
);

export default router;
