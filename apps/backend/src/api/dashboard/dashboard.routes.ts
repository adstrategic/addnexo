import { Router } from "express";

import * as controller from "./dashboard.controller.js";

const router: Router = Router();

// GET /api/v1/dashboard/inventory - Inventory/Kardex dashboard (period-scoped)
router.get("/inventory", controller.getInventoryDashboardHandler);

// GET /api/v1/dashboard/billing - Billing dashboard
router.get("/billing", controller.getBillingDashboardHandler);

export default router;
