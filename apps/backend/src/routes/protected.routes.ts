import { Router } from "express";

import almacenesRoutes from "../api/almacenes/almacenes.routes.js";
import balanceInvoicesRoutes from "../api/balance-invoices/balance-invoices.routes.js";
import banksRoutes from "../api/banks/banks.routes.js";
import catalogoRoutes from "../api/catalogo/catalogo.routes.js";
import clientsRoutes from "../api/clientes/clientes.routes.js";
import dashboardRoutes from "../api/dashboard/dashboard.routes.js";
import dispatchOrderRoutes from "../api/dispatch-order/dispatch-order.routes.js";
import documentsRoutes from "../api/documents/documents.routes.js";
import geographyRoutes from "../api/geography/geography.routes.js";
import gruposRoutes from "../api/grupos/grupos.routes.js";
import invoicesRoutes from "../api/invoices/invoices.routes.js";
import movkarRoutes from "../api/movkar/movkar.routes.js";
import periodRoutes from "../api/period/period.routes.js";
import suppliersRoutes from "../api/proveedores/proveedores.routes.js";
import movementTypesRoutes from "../api/tmovkar/tmovkar.routes.js";
import unidadesRoutes from "../api/unidades/unidades.routes.js";
import vendorsRoutes from "../api/vendedores/vendedores.routes.js";
import {
  requireActiveOrganization,
  requireRole,
  requireSession,
} from "../middleware/auth.middleware.js";
import { contextMiddleware } from "../middleware/context.middleware.js";
import kardexRoutes from "../api/kardex/kardex.routes.js";
import reminderConfigRoutes from "../api/reminder-config/reminder-config.routes.js";
import movCxcRoutes from "../api/mov-cxc/mov-cxc.routes.js";

export const apiRouter: Router = Router();

// Layer 1: All /api/v1 routes require an authenticated session
apiRouter.use(requireSession());

// Layer 2: All tenant-scoped routes require an active organization
apiRouter.use(requireActiveOrganization());

// Layer 3: Resolve active period per request
apiRouter.use(contextMiddleware);

// Feature routes with role-based access (requireRole is the common rule):
// - Admin-only features use requireRole(["admin"]).
// - warehouse_manager is limited to /dispatch-orders (its actions are gated per-verb
//   with requirePermission inside the router) plus /period (read) for the closing guard.
apiRouter.use("/measurement-types", requireRole(["admin"]), unidadesRoutes);
apiRouter.use("/warehouses", requireRole(["admin"]), almacenesRoutes);
apiRouter.use("/inventory-groups", requireRole(["admin"]), gruposRoutes);
apiRouter.use("/catalog", requireRole(["admin"]), catalogoRoutes);
apiRouter.use("/suppliers", requireRole(["admin"]), suppliersRoutes);
apiRouter.use("/clients", requireRole(["admin"]), clientsRoutes);
apiRouter.use("/vendors", requireRole(["admin"]), vendorsRoutes);
apiRouter.use("/geography", requireRole(["admin"]), geographyRoutes);
apiRouter.use("/movement-types", requireRole(["admin"]), movementTypesRoutes);
apiRouter.use("/movements", requireRole(["admin"]), movkarRoutes);
apiRouter.use("/dashboard", requireRole(["admin"]), dashboardRoutes);
apiRouter.use(
  "/period",
  requireRole(["admin", "warehouse_manager"]),
  periodRoutes,
);
apiRouter.use(
  "/dispatch-orders",
  requireRole(["admin", "warehouse_manager"]),
  dispatchOrderRoutes,
);
apiRouter.use("/reminder-config", requireRole(["admin"]), reminderConfigRoutes);
apiRouter.use("/invoices", requireRole(["admin"]), invoicesRoutes);
apiRouter.use(
  "/balance-invoices",
  requireRole(["admin"]),
  balanceInvoicesRoutes,
);
apiRouter.use("/documents", requireRole(["admin"]), documentsRoutes);
apiRouter.use("/banks", requireRole(["admin"]), banksRoutes);
apiRouter.use("/mov-cxc", requireRole(["admin"]), movCxcRoutes);
apiRouter.use("/kardex", requireRole(["admin"]), kardexRoutes);

apiRouter.get("/", (req, res) => {
  res.json({ message: "API v1 is running" });
});
