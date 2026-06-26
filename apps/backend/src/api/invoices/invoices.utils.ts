interface FacturaOriginalRowLike {
  FUCantidad: number;
  FUId: number;
  FUInvcaruniId: number;
  FULote: string;
  FULoteNroDocumento: string;
}

interface FacturaReturnRowWithOptionalOriginLike {
  FUCantidad: number;
  FUInvcaruniId: number;
  FULote: string;
  FULoteNroDocumento: string;
  FUOriginalItemId?: null | number;
}

/**
 * Returns summed invoice-return quantity by original FUId.
 * - Uses explicit FUOriginalItemId links when present.
 * - Falls back to deterministic allocation for legacy rows without origin link.
 */
export function sumFacturaReturnsByOriginalItemId<
  TOriginal extends FacturaOriginalRowLike,
  TReturn extends FacturaReturnRowWithOptionalOriginLike,
>(originalItems: TOriginal[], returnItems: TReturn[]): Map<number, number> {
  const totalsByOriginalId = new Map<number, number>();
  for (const original of originalItems) {
    totalsByOriginalId.set(original.FUId, 0);
  }

  const originalsByKey = new Map<string, TOriginal[]>();
  for (const original of originalItems) {
    const key = `${original.FUInvcaruniId}-${original.FULote}-${original.FULoteNroDocumento}`;
    const rows = originalsByKey.get(key) ?? [];
    rows.push(original);
    originalsByKey.set(key, rows);
  }
  for (const rows of originalsByKey.values()) {
    rows.sort((a, b) => a.FUId - b.FUId);
  }

  const legacyPendingByKey = new Map<string, number>();

  for (const returned of returnItems) {
    if (returned.FUOriginalItemId != null) {
      const current = totalsByOriginalId.get(returned.FUOriginalItemId) ?? 0;
      totalsByOriginalId.set(
        returned.FUOriginalItemId,
        current + Number(returned.FUCantidad),
      );
      continue;
    }

    const key = `${returned.FUInvcaruniId}-${returned.FULote}-${returned.FULoteNroDocumento}`;
    const currentPending = legacyPendingByKey.get(key) ?? 0;
    legacyPendingByKey.set(key, currentPending + Number(returned.FUCantidad));
  }

  for (const [key, pendingTotal] of legacyPendingByKey) {
    const originalsForKey = originalsByKey.get(key) ?? [];
    let remaining = pendingTotal;
    for (const original of originalsForKey) {
      if (remaining <= 0) break;
      const originalQty = Number(original.FUCantidad);
      const current = totalsByOriginalId.get(original.FUId) ?? 0;
      const available = Math.max(originalQty - current, 0);
      const assigned = Math.min(available, remaining);
      if (assigned > 0) {
        totalsByOriginalId.set(original.FUId, current + assigned);
        remaining -= assigned;
      }
    }
  }

  return totalsByOriginalId;
}
