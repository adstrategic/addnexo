import { mapDecimalFields } from "../../lib/mappers.js";
import { mapFacturagToApi } from "../balance-invoices/balance-invoices.mapper.js";

const MOV_CXC_DECIMAL_FIELDS = ["MCValor"] as const;

/** Map a CXC movement for API/JSON responses. */
export function mapMovCXCToApi<T extends Record<string, unknown>>(mov: T): T {
  return mapDecimalFields(mov, MOV_CXC_DECIMAL_FIELDS);
}

type FacturaGLike = Parameters<typeof mapFacturagToApi>[0] & {
  movCXC?: Record<string, unknown>[];
};

/** Map a sales invoice header (+ relations) for API/JSON responses. */
export function mapFacturaGToApi<T extends FacturaGLike>(factura: T): T {
  const mapped = mapFacturagToApi(factura) as T;

  if (Array.isArray(mapped.movCXC)) {
    mapped.movCXC = mapped.movCXC.map(mapMovCXCToApi);
  }

  return mapped;
}

/** Map an array of sales invoices for API/JSON responses. */
export function mapFacturaGListToApi<T extends FacturaGLike>(
  facturas: T[],
): T[] {
  return facturas.map(mapFacturaGToApi);
}
