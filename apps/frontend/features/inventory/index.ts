/**
 * Inventory Dashboard Module
 *
 * Period-scoped inventory dashboard: KPIs, origin breakdown, product rotation
 * (DIO) and the kardex-by-product table.
 *
 * @module inventory
 */

// Components
export { InventoryContent } from "./components/InventoryContent";
export { InventoryKpiCard } from "./components/InventoryKpiCard";
export { InventoryTable } from "./components/InventoryTable";
export { OriginDonut } from "./components/OriginDonut";
export { RotationChart } from "./components/RotationChart";

// Schemas / types
export {
  inventoryDashboardResponseSchema,
  type InventoryDashboardQuery,
  type InventoryDashboardResponse,
  type InventoryFilterOptions,
  type InventoryKardexTableRow,
  type InventoryLotRow,
  type KardexDataFilters,
  type KPIMetric,
  type OriginBreakdownItem,
  type ProductSummary,
} from "./schemas/InventorySchemas";

// Services
export { inventoryService } from "./services/InventoryServices";

// Hooks
export {
  inventoryDashboardKeys,
  useInventoryDashboard,
} from "./hooks/useInventoryDashboard";
