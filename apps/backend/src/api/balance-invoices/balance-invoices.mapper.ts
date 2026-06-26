import { mapDecimalFields } from "../../lib/mappers.js";
import { mapClienteToApi } from "../clientes/clientes.mapper.js";
import { mapInvcaruniToApi } from "../dispatch-order/dispatch-order.mapper.js";

const FACTURAG_DECIMAL_FIELDS = [
  "FGValorTotalNeto",
  "FGValorTotalBruto",
  "FGTotalDescuento",
  "FGTotalIVA",
  "FGSaldo",
] as const;

const FACTURAU_DECIMAL_FIELDS = [
  "FUCantidad",
  "FUDescuento",
  "FUVrNeto",
  "FUVrBruto",
  "FUVrUnitario",
  "FUCostoPromedio",
] as const;

type FacturauLike = Record<string, unknown> & {
  invcaruni?: null | Record<string, unknown>;
};

/** Map a balance invoice line item (facturau) for API/JSON responses. */
export function mapFacturauToApi<T extends FacturauLike>(item: T): T {
  const mapped = mapDecimalFields(item, FACTURAU_DECIMAL_FIELDS);
  if (mapped.invcaruni != null) {
    return {
      ...mapped,
      invcaruni: mapInvcaruniToApi(mapped.invcaruni),
    };
  }
  return mapped;
}

/** Map an array of balance invoice line items for API/JSON responses. */
export function mapFacturauListToApi<T extends FacturauLike>(items: T[]): T[] {
  return items.map(mapFacturauToApi);
}

type FacturagLike = Record<string, unknown> & {
  cltemae?: null | Record<string, unknown>;
  facturau?: FacturauLike[];
};

/** Map a balance invoice header (+ optional items) for API/JSON responses. */
export function mapFacturagToApi<T extends FacturagLike>(factura: T): T {
  const mapped = mapDecimalFields(factura, FACTURAG_DECIMAL_FIELDS);

  if (mapped.cltemae != null) {
    mapped.cltemae = mapClienteToApi(mapped.cltemae);
  }

  if (Array.isArray(mapped.facturau)) {
    mapped.facturau = mapped.facturau.map(mapFacturauToApi);
  }

  return mapped;
}
