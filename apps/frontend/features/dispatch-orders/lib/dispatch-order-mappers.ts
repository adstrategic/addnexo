import type { CreateDispatchOrderHeaderData } from "../schemas/dispatch-order-schema";
import type {
  DispatchOrderItemResponse,
  DispatchOrderResponse,
} from "../schemas/dispatch-order-response.schema";
import type { DispatchOrderItem } from "../schemas/dispatch-order-schema";

/** Map API dispatch order → header-only react-hook-form values */
export function toHeaderFormValues(
  order: DispatchOrderResponse | undefined,
): CreateDispatchOrderHeaderData | undefined {
  if (!order) return undefined;

  return {
    DOGClienteId: order.DOGClienteId,
    DOGVendedorId: order.DOGVendedorId,
    DOGPurchaseOrder: order.DOGPurchaseOrder ?? null,
    DOGTipo: order.DOGTipo,
    DOGZona: order.DOGZona,
    DOGTelefono1: order.DOGTelefono1,
    DOGTelefono2: order.DOGTelefono2 ?? null,
    DOGCorreo1: order.DOGCorreo1,
    DOGCorreo2: order.DOGCorreo2 ?? null,
    DOGDireccionEntrega: order.DOGDireccionEntrega,
    DOGCiudadId: order.DOGCiudadId,
    DOGFechaCreado: order.DOGFechaCreado,
    DOGCondicion1: order.DOGCondicion1 ?? "",
    DOGCondicion2: order.DOGCondicion2 ?? "",
    DOGCondicion3: order.DOGCondicion3 ?? "",
  };
}

/** Map parsed API item → editable row in the items form */
export function serverItemToFormItem(
  serverItem: DispatchOrderItemResponse,
): DispatchOrderItem {
  return {
    DOUId: serverItem.DOUId,
    DOUInvcaruniId: serverItem.DOUInvcaruniId,
    DOUCantidad: serverItem.DOUCantidad,
    DOUVrUnitario: serverItem.DOUVrUnitario,
    DOUDescuento: serverItem.DOUDescuento,
    DOUTieneImpuesto: serverItem.DOUTieneImpuesto,
    DOULote: serverItem.DOULote,
    DOUNroDocumento: serverItem.DOUNroDocumento,
    DOUReservar: serverItem.DOUReservado ?? false,
  };
}

export function serverItemsToFormItems(
  items: DispatchOrderItemResponse[] | undefined,
): DispatchOrderItem[] {
  return (items ?? []).map(serverItemToFormItem);
}
