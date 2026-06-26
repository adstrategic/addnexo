/**
 * Dispatch Orders feature module
 */

export {
  createDispatchOrderHeaderSchema,
  updateDispatchOrderSchema,
  dispatchOrderItemSchema,
  dispatchOrderItemsFormSchema,
  type CreateDispatchOrderHeaderData,
  type UpdateDispatchOrderData,
  type DispatchOrderItem,
  type DispatchOrderHeaderFormData,
  type DispatchOrderItemsFormData,
  /** @deprecated Use DispatchOrderHeaderFormData */
  type DispatchOrderFormData,
} from "./schemas/dispatch-order-schema";

export {
  listDispatchOrdersParamsSchema,
  dispatchOrderResponseSchema,
  dispatchOrderItemResponseSchema,
  type ListDispatchOrdersParams,
  type DispatchOrderResponse,
  type DispatchOrderItemResponse,
  type DispatchOrderListResponse,
  type DispatchOrderEstado,
} from "./schemas/dispatch-order-response.schema";

export {
  useDispatchOrders,
  useDispatchOrder,
  useUpdateDispatchOrder,
  useEmitDispatchOrder,
  useDeleteDispatchOrder,
  useCreateDispatchOrderHeader,
  useAddDispatchOrderItem,
  useUpdateDispatchOrderItem,
  useDeleteDispatchOrderItem,
  useRegenerateEmittedDispatchPdf,
  useAnnulDispatchOrder,
  dispatchOrderKeys,
} from "./hooks/useDispatchOrders";

export {
  useDispatchOrderDocuments,
  useDispatchOrderWithFiles,
  useDocumentDownloadUrl,
  type DispatchOrderDocument,
} from "./hooks/useDispatchOrderDocuments";

export { useDispatchOrderActions } from "./hooks/useDispatchOrderActions";
export { useDispatchOrderDelete } from "./hooks/useDispatchOrderDelete";
export { useDispatchOrderToInvoice } from "./hooks/useDispatchOrderToInvoice";
export { useDispatchOrderAnnulment } from "./hooks/useDispatchOrderAnnulment";
export { useDispatchClienteAutofill } from "./hooks/useDispatchClienteAutofill";

export { dispatchOrdersService } from "./service/dispatch-orders.service";
export { dispatchOrderDocumentsService } from "./service/dispatch-order-documents.service";

export { dispatchOrderUtils, INVOICE_CONVERSION_ENABLED } from "./lib/utils";

export { DispatchOrdersContent } from "./components/DispatchOrdersContent";
export { DispatchOrdersTable } from "./components/DispatchOrdersTable";
export { DispatchOrderDetails } from "./components/DispatchOrderDetails";
export { DispatchOrderActions } from "./components/DispatchOrderActions";
export { DispatchOrderFilter } from "./components/DispatchOrderFilter";
export { DispatchOrderForm } from "./forms/DispatchOrderForm";
