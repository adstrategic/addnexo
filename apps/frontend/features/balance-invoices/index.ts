// Components
export { BalanceInvoicesContent } from "./components/BalanceInvoicesContent";
export { BalanceInvoicesTable } from "./components/BalanceInvoicesTable";
export { BalanceInvoicesDetails } from "./components/BalanceInvoicesDetails";
export { BalanceInvoicesActions } from "./components/BalanceInvoicesActions";
export { BalanceInvoicesFilter } from "./components/BalanceInvoicesFilter";

// Forms
export { BalanceInvoicesForm } from "./forms/BalanceInvoicesForm";

// Data hooks
export {
  useBalanceInvoices,
  useBalanceInvoice,
  useNextFacturaNumber,
  useCreateBalanceInvoiceHeader,
  useUpdateBalanceInvoice,
  useDeleteBalanceInvoice,
  useAddBalanceInvoiceItem,
  useUpdateBalanceInvoiceItem,
  useDeleteBalanceInvoiceItem,
  balanceInvoiceKeys,
} from "./hooks/useBalanceInvoices";

export { useBalanceInvoiceActions } from "./hooks/useBalanceInvoicesActions";
export { useBalanceInvoiceDelete } from "./hooks/useBalanceInvoiceDelete";
export { useSaldosClienteAutofill } from "./hooks/useBalanceInvoicesAutofill";

// Service
export {
  facturaApi,
  facturaUtils,
} from "./service/BalanceInvoicesService";

// Schemas — input/form validation
export type {
  CreateBalanceInvoiceHeaderData,
  UpdateBalanceInvoiceData,
  BalanceInvoiceItem,
} from "./schemas/BalanceInvoicesSchema";
export {
  saldosFacturaHeaderSchema,
  updateBalanceInvoiceSchema,
  saldosFacturaItemSchema,
  createBalanceInvoiceHeaderSchema,
} from "./schemas/BalanceInvoicesSchema";

// Schemas — API response types
export type {
  Factura,
  ServerFactura,
  ServerBalanceInvoicesItem,
  ServerFacturasResponse,
  ServerNextNumberResponse,
  TipoPago,
  EstadoFacturaValue,
} from "./schemas/BalanceInvoicesResponseSchema";
export { EstadoFactura } from "./schemas/BalanceInvoicesResponseSchema";

// Form types
export type { BalanceInvoicesFormData } from "./forms/hooks/useBalanceInvoicesForm";
