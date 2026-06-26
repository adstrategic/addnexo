import { mapDecimalFields } from "../../lib/mappers.js";

/** Prisma Decimal fields on Cltemae (matches frontend clientResponseSchema). */
const CLTEMAE_DECIMAL_FIELDS = [
  "CDiasParaVencerFactura",
  "CRecordatorioPostVencido",
] as const;

/** Map a client row (or nested relation) for API/JSON responses. */
export function mapClienteToApi<T extends Record<string, unknown>>(
  cltemae: null | T | undefined,
): null | T | undefined {
  if (cltemae == null) {
    return cltemae;
  }
  return mapDecimalFields(cltemae, CLTEMAE_DECIMAL_FIELDS);
}

export function mapClienteListToApi<T extends Record<string, unknown>>(
  clientes: T[],
): T[] {
  return clientes.map((cliente) =>
    mapDecimalFields(cliente, CLTEMAE_DECIMAL_FIELDS),
  );
}
