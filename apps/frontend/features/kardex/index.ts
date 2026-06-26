/**
 * Kardex Dashboard Module
 *
 * Period-scoped kardex dashboard with product → lot → transaction drill-down.
 * Reads the shared inventory dashboard endpoint plus GET /movements for the
 * transaction log.
 *
 * @module kardex
 */

// Components
export { KardexContent } from "./components/KardexContent";
export { LotDetailTable } from "./components/LotDetailTable";
export { ProductSummaryTable } from "./components/ProductSummaryTable";
export { TransactionLogTable } from "./components/TransactionLogTable";

// Schemas / types
export {
  kardexMovementsResponseSchema,
  type KardexLot,
  type KardexMovement,
  type KardexMovementsQuery,
  type KardexMovementsResponse,
  type KardexProduct,
  type KardexProductTotals,
  type KardexTableServerPagination,
  type KardexTransaction,
} from "./schemas/KardexSchemas";

// Services
export { kardexService } from "./services/KardexServices";

// Hooks
export {
  kardexKeys,
  useKardexLots,
  useKardexMovements,
  useKardexProducts,
} from "./hooks/useKardexDashboard";
