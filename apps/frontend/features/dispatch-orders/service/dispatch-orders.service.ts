import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateDispatchOrderHeaderData,
  UpdateDispatchOrderData,
} from "../schemas/dispatch-order-schema";
import {
  devolucionItemsResponseSchema,
  dispatchOrderItemResponseSchema,
  dispatchOrderItemsResponseSchema,
  dispatchOrderListResponseSchema,
  dispatchOrderResponseSchema,
  movimientosSalidaResponseSchema,
  type DispatchOrderListResponse,
  type DispatchOrderResponse,
  type ListDispatchOrdersParams,
  type UpdateDispatchOrderItemResponse,
} from "../schemas/dispatch-order-response.schema";
import {
  convertedInvoiceResponseSchema,
  type ConvertDispatchOrderToInvoiceData,
  type ConvertedInvoiceResponse,
} from "../schemas/dispatch-order-to-invoice.schema";

const BASE_URL = "/dispatch-orders";
/** Invoice creation lives under the facturas (invoices) resource. */
const INVOICES_URL = "/invoices";

function parseDispatchOrder(data: unknown): DispatchOrderResponse {
  return dispatchOrderResponseSchema.parse(data);
}

function parseDispatchOrderItems(
  data: unknown,
): DispatchOrderResponse["dispatchOrderU"] {
  const validated = dispatchOrderItemsResponseSchema.parse(data);
  return validated.items;
}

async function list(
  params?: ListDispatchOrdersParams,
): Promise<DispatchOrderListResponse> {
  try {
    const { data } = await apiClient.get(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        estado: params?.estado,
        clienteId: params?.clienteId,
        vendedorId: params?.vendedorId,
        fechaDesde: params?.fechaDesde,
        fechaHasta: params?.fechaHasta,
      },
    });
    return dispatchOrderListResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function getBySequence(
  secuencia: number,
): Promise<DispatchOrderResponse> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${secuencia}`);
    return parseDispatchOrder(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createHeader(
  dto: CreateDispatchOrderHeaderData,
): Promise<DispatchOrderResponse> {
  try {
    const { data } = await apiClient.post(`${BASE_URL}/headers`, dto);

    return parseDispatchOrder(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function update(
  id: number,
  dto: UpdateDispatchOrderData,
): Promise<DispatchOrderResponse> {
  try {
    const { data } = await apiClient.put(`${BASE_URL}/${id}`, dto);
    return parseDispatchOrder(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function emit(
  id: number,
  dto: UpdateDispatchOrderData,
): Promise<DispatchOrderResponse> {
  try {
    const { data } = await apiClient.patch(`${BASE_URL}/${id}/emit`, dto);
    return parseDispatchOrder(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function remove(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

async function addItem(
  orderId: number,
  itemData: {
    DOUInvcaruniId: number;
    DOUCantidad: number;
    DOUVrUnitario: number;
    DOUDescuento: number;
    DOUTieneImpuesto: boolean;
    DOULote: number | null;
    DOUNroDocumento: string | null;
    DOUModoSalida: "MANUAL" | "AUTOMATICO";
    DOUReservar?: boolean;
  },
): Promise<DispatchOrderResponse["dispatchOrderU"]> {
  try {
    const { data } = await apiClient.post(
      `${BASE_URL}/${orderId}/items`,
      itemData,
    );
    return parseDispatchOrderItems(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateItem(
  orderId: number,
  itemId: number,
  updateData: {
    DOUCantidad?: number;
    DOUVrUnitario?: number;
    DOUDescuento?: number;
    DOUTieneImpuesto?: boolean;
    DOULote?: number | null;
    DOUNroDocumento?: string | null;
    DOUDetalle?: string;
    DOUReservar?: boolean;
  },
): Promise<UpdateDispatchOrderItemResponse> {
  try {
    const { data } = await apiClient.put(
      `${BASE_URL}/${orderId}/items/${itemId}`,
      updateData,
    );
    return dispatchOrderItemsResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function removeItem(orderId: number, itemId: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${orderId}/items/${itemId}`);
  } catch (error) {
    handleApiError(error);
  }
}

async function getMovimientosSalida(secuencia: number) {
  try {
    const { data } = await apiClient.get(
      `${BASE_URL}/${secuencia}/movimientos-salida`,
    );
    const validated = movimientosSalidaResponseSchema.parse(data);
    return validated.movimientos;
  } catch (error) {
    handleApiError(error);
  }
}

async function updateCantidadDevuelta(
  secuencia: number,
  itemId: number,
  DOUCantidadDevuelta: number,
): Promise<DispatchOrderResponse["dispatchOrderU"]> {
  try {
    const { data } = await apiClient.patch(
      `${BASE_URL}/${secuencia}/items/${itemId}/cantidad-devuelta`,
      { DOUCantidadDevuelta },
    );
    return parseDispatchOrderItems(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function downloadPdf(secuencia: number): Promise<void> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${secuencia}/pdf`, {
      responseType: "blob",
    });
    const blob = data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispatch-order-${secuencia}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    handleApiError(error);
  }
}

async function getItemsDisponiblesParaDevolucion(secuencia: number) {
  try {
    const { data } = await apiClient.get(
      `${BASE_URL}/${secuencia}/devoluciones/items-disponibles`,
    );
    const validated = devolucionItemsResponseSchema.parse(data);
    return validated.items;
  } catch (error) {
    handleApiError(error);
  }
}

async function crearDevoluciones(
  secuencia: number,
  devoluciones: Array<{ DOUId: number; DOUCantidad: number }>,
): Promise<DispatchOrderResponse["dispatchOrderU"]> {
  try {
    const { data } = await apiClient.post(
      `${BASE_URL}/${secuencia}/devoluciones`,
      { devoluciones },
    );
    return parseDispatchOrderItems(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function regenerarPdfEmitido(
  secuencia: number,
): Promise<DispatchOrderResponse> {
  try {
    const { data } = await apiClient.post(
      `${BASE_URL}/${secuencia}/regenerate-emitted-pdf`,
    );
    return parseDispatchOrder(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function anular(
  secuencia: number,
  razonAnulacion?: string,
): Promise<DispatchOrderResponse> {
  try {
    const { data } = await apiClient.patch(`${BASE_URL}/${secuencia}/anular`, {
      razonAnulacion,
    });
    return parseDispatchOrder(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function convertToInvoice(
  dto: ConvertDispatchOrderToInvoiceData,
): Promise<ConvertedInvoiceResponse> {
  try {
    const { data } = await apiClient.post(INVOICES_URL, dto);
    return convertedInvoiceResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const dispatchOrdersService = {
  list,
  convertToInvoice,
  getBySequence,
  createHeader,
  update,
  emit,
  remove,
  addItem,
  updateItem,
  removeItem,
  getMovimientosSalida,
  updateCantidadDevuelta,
  downloadPdf,
  getItemsDisponiblesParaDevolucion,
  crearDevoluciones,
  regenerarPdfEmitido,
  anular,
  /** @internal Exported for tests — prefer feature service methods */
  parseDispatchOrder,
  parseDispatchOrderItem: (data: unknown) =>
    dispatchOrderItemResponseSchema.parse(data),
};
