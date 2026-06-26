import { mapDecimalFields } from "../../lib/mappers.js";
import { mapClienteToApi } from "../clientes/clientes.mapper.js";

const DISPATCH_ORDER_G_DECIMAL_FIELDS = [
  "DOGValorTotalNeto",
  "DOGValorTotalBruto",
  "DOGTotalDescuento",
  "DOGTotalIVA",
  "DOGPesoTotalKg",
] as const;

const DISPATCH_ORDER_U_DECIMAL_FIELDS = [
  "DOUCantidad",
  "DOUDescuento",
  "DOUVrNeto",
  "DOUVrBruto",
  "DOUVrUnitario",
  "DOUCostoPromedio",
  "DOUPesoTotalKg",
] as const;

const INVCARUNI_DECIMAL_FIELDS = [
  "CKPrecioPublico",
  "CKPrecioVenta1",
  "CKPrecioVenta2",
  "CKPorcenMargen",
  "CKPorcenMargenTopeDesc",
  "CKTopeDescuento",
  "CKIva",
  "CKPesoPromedioKg",
] as const;

export function mapInvcaruniToApi<T extends Record<string, unknown>>(
  invcaruni: null | T | undefined,
): null | T | undefined {
  if (invcaruni == null) {
    return invcaruni;
  }
  return mapDecimalFields(invcaruni, INVCARUNI_DECIMAL_FIELDS);
}

type DispatchOrderULike = Record<string, unknown> & {
  invcaruni?: null | Record<string, unknown>;
};

/** Map a dispatch order line item for API/JSON responses. */
export function mapDispatchOrderUToApi<T extends DispatchOrderULike>(
  item: T,
): T {
  const mapped = mapDecimalFields(item, DISPATCH_ORDER_U_DECIMAL_FIELDS);
  if (mapped.invcaruni != null) {
    return {
      ...mapped,
      invcaruni: mapInvcaruniToApi(mapped.invcaruni),
    };
  }
  return mapped;
}

/** Map an array of dispatch order line items for API/JSON responses. */
export function mapDispatchOrderUListToApi<T extends DispatchOrderULike>(
  items: T[],
): T[] {
  return items.map(mapDispatchOrderUToApi);
}

type DispatchOrderGLike = Record<string, unknown> & {
  cltemae?: null | Record<string, unknown>;
  dispatchOrderReturns?: DispatchOrderULike[];
  dispatchOrderU?: DispatchOrderULike[];
};

/** Map a dispatch order header (+ optional items) for API/JSON responses. */
export function mapDispatchOrderGToApi<T extends DispatchOrderGLike>(
  dispatchOrder: T,
): T {
  const mapped = mapDecimalFields(
    dispatchOrder,
    DISPATCH_ORDER_G_DECIMAL_FIELDS,
  );

  if (mapped.cltemae != null) {
    mapped.cltemae = mapClienteToApi(mapped.cltemae);
  }

  if (Array.isArray(mapped.dispatchOrderU)) {
    mapped.dispatchOrderU = mapped.dispatchOrderU.map(mapDispatchOrderUToApi);
  }

  if (Array.isArray(mapped.dispatchOrderReturns)) {
    mapped.dispatchOrderReturns = mapped.dispatchOrderReturns.map(
      mapDispatchOrderUToApi,
    );
  }

  return mapped;
}
