/**
 * Billing Dashboard Module
 *
 * Invoice consultation dashboard: KPIs, status/revenue/payment analytics, a
 * filterable + paginated invoice table and an invoice detail drawer. Reads the
 * shared dashboard endpoint at GET /dashboard/billing.
 *
 * @module billing-dashboard
 */

// Components
export { BillingContent } from "./components/BillingContent";
export { AnalyticsPanel } from "./components/AnalyticsPanel";
export { BillingFiltersBar } from "./components/BillingFiltersBar";
export { BillingKpiStrip } from "./components/BillingKpiStrip";
export { BillingSummaryBar } from "./components/BillingSummaryBar";
export { BillingTable } from "./components/BillingTable";
export { InvoiceDetailSheet } from "./components/InvoiceDetailSheet";

// Schemas / types
export {
  billingDashboardResponseSchema,
  type BillingDashboardQuery,
  type BillingDashboardResponse,
  type BillingFilterState,
  type BillingInvoice,
  type BillingStatus,
  type MethodDatum,
  type MonthlyRevenue,
  type PaymentMethod,
} from "./schemas/BillingSchemas";

// Services
export { billingService } from "./services/BillingServices";

// Hooks
export {
  billingDashboardKeys,
  useBillingDashboard,
} from "./hooks/useBillingDashboard";
