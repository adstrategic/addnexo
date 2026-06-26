import { Router } from "express";
import * as controller from "./reminder-config.controller.js";
import { updateReminderConfigSchema } from "./reminder-config.validator.js";
import { validateRequest } from "../../core/validateRequest.js";

const router: Router = Router();

router.get("/", controller.getReminderConfigHandler);

router.patch(
  "/",
  validateRequest(updateReminderConfigSchema),
  controller.updateReminderConfigHandler,
);

export default router;
