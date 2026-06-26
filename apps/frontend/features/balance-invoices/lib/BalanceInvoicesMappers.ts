import type { CreateBalanceInvoiceHeaderData } from "../schemas/BalanceInvoicesSchema";
import type { Factura, ServerBalanceInvoicesItem } from "../schemas/BalanceInvoicesResponseSchema";

/** Map API factura response → header-only react-hook-form values */
export function toHeaderFormValues(
  factura: Factura | undefined,
): CreateBalanceInvoiceHeaderData | undefined {
  if (!factura) return undefined;

  return {
    FGVendedorId: factura.FGVendedorId,
    FGNro: factura.FGNro,
    FGClienteId: factura.FGClienteId,
    FGPurchaseOrder: factura.FGPurchaseOrder ?? null,
    FGPago: factura.FGPago,
    FGValorTotal: Number(factura.FGValorTotalNeto),
    FGTelefono1: factura.FGTelefono1,
    FGTelefono2: factura.FGTelefono2 ?? null,
    FGCorreo1: factura.FGCorreo1,
    FGCorreo2: factura.FGCorreo2 ?? null,
    FGDireccionEntrega: factura.FGDireccionEntrega ?? "",
    FGCiudadId: factura.FGCiudadId,
    // Already normalized to a local calendar-day Date by the response schema.
    FGFechaCreado: factura.FGFechaCreado,
    FGFechaVencimiento: factura.FGFechaVencimiento,
    FGCondicion1: factura.FGCondicion1 ?? "",
    FGCondicion2: factura.FGCondicion2 ?? "",
    FGCondicion3: factura.FGCondicion3 ?? "",
  };
}

/** Map a single DB item → items form row */
export function serverItemToFormItem(item: ServerBalanceInvoicesItem) {
  return {
    FUInvcaruniId: item.FUInvcaruniId,
    FUVrUnitario: Number(item.FUVrUnitario),
  };
}

/** Map DB items array → items form rows */
export function serverItemsToFormItems(items: ServerBalanceInvoicesItem[] | undefined) {
  return (items ?? []).map(serverItemToFormItem);
}
