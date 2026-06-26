interface ItemLike {
  DOUCantidad: number;
  DOUInvcaruniId: number;
  DOULote: string;
  DOUNroDocumento: string;
  DOUVrBruto: number;
  DOUVrNeto: number;
}

interface ReturnLike {
  DOUCantidad: number;
  DOUInvcaruniId: number;
  DOULote: string;
  DOUNroDocumento: string;
}

interface LotQuantityLike {
  DOUCantidad: number;
  DOUId?: number;
  DOUInvcaruniId: number;
  DOULote: string;
  DOUNroDocumento: string;
}

interface DispatchRowLike {
  DOUCantidad: number;
  DOUId: number;
  DOUInvcaruniId: number;
  DOULote: string;
  DOUNroDocumento: string;
}

interface ReturnRowWithOptionalOriginLike extends Omit<
  DispatchRowLike,
  "DOUId"
> {
  DOUOriginalItemId?: null | number;
}

/**
 * Applies returns to original items preserving row independence.
 * When multiple rows share the same product+lot+document, returns are consumed
 * sequentially by row order instead of subtracting the full return amount from
 * every row.
 */
export const applyReturnsToOriginalItems = <
  T extends ItemLike,
  R extends ReturnLike,
>(
  originalItems: T[],
  returnItems: R[],
): T[] => {
  const returnedByKey = new Map<string, number>();

  for (const returned of returnItems) {
    const key = `${returned.DOUInvcaruniId}-${returned.DOULote}-${returned.DOUNroDocumento}`;
    const current = returnedByKey.get(key) ?? 0;
    returnedByKey.set(key, current + Number(returned.DOUCantidad));
  }

  return originalItems.map((item) => {
    const key = `${item.DOUInvcaruniId}-${item.DOULote}-${item.DOUNroDocumento}`;
    const pendingReturned = returnedByKey.get(key) ?? 0;
    const originalQty = Number(item.DOUCantidad);
    const consumedForThisRow = Math.min(originalQty, pendingReturned);
    const netQty = originalQty - consumedForThisRow;

    returnedByKey.set(key, pendingReturned - consumedForThisRow);

    if (netQty <= 0) {
      return {
        ...item,
        DOUCantidad: 0,
        DOUVrBruto: 0,
        DOUVrNeto: 0,
      };
    }

    const ratio = netQty / originalQty;
    return {
      ...item,
      DOUCantidad: netQty,
      DOUVrBruto: Number(item.DOUVrBruto) * ratio,
      DOUVrNeto: Number(item.DOUVrNeto) * ratio,
    };
  });
};

interface RequestedTotalParams<T extends LotQuantityLike> {
  excludeItemId?: number;
  existingItems: T[];
  invcaruniId: number;
  lote: string;
  nroDocumento: string;
  requestedQuantity: number;
}

export const calculateRequestedTotalForLot = <T extends LotQuantityLike>({
  existingItems,
  invcaruniId,
  lote,
  nroDocumento,
  requestedQuantity,
  excludeItemId,
}: RequestedTotalParams<T>): number => {
  const alreadyRequested = existingItems
    .filter((item) => item.DOUInvcaruniId === invcaruniId)
    .filter((item) => item.DOULote === lote)
    .filter((item) => item.DOUNroDocumento === nroDocumento)
    .filter((item) => excludeItemId == null || item.DOUId !== excludeItemId)
    .reduce((sum, item) => sum + Number(item.DOUCantidad), 0);

  return alreadyRequested + Number(requestedQuantity);
};

/**
 * Distributes already-created return quantities to original rows in DOUId order.
 * This keeps sibling rows independent even if they share product+lot+document.
 */
export const calculateReturnedQuantityByOriginalRow = <
  TOriginal extends DispatchRowLike,
  TReturn extends Omit<DispatchRowLike, "DOUId">,
>(
  originalItems: TOriginal[],
  returnItems: TReturn[],
): Map<number, number> => {
  const returnsPendingByKey = new Map<string, number>();
  for (const returned of returnItems) {
    const key = `${returned.DOUInvcaruniId}-${returned.DOULote}-${returned.DOUNroDocumento}`;
    const current = returnsPendingByKey.get(key) ?? 0;
    returnsPendingByKey.set(key, current + Number(returned.DOUCantidad));
  }

  const returnedByOriginalId = new Map<number, number>();
  const sortedOriginals = [...originalItems].sort((a, b) => a.DOUId - b.DOUId);

  for (const original of sortedOriginals) {
    const key = `${original.DOUInvcaruniId}-${original.DOULote}-${original.DOUNroDocumento}`;
    const pending = returnsPendingByKey.get(key) ?? 0;
    const originalQty = Number(original.DOUCantidad);
    const assignedToThisRow = Math.min(originalQty, pending);

    returnedByOriginalId.set(original.DOUId, assignedToThisRow);
    returnsPendingByKey.set(key, pending - assignedToThisRow);
  }

  return returnedByOriginalId;
};

/**
 * Returns summed quantity by original DOUId.
 * - Uses explicit DOUOriginalItemId links when present.
 * - Falls back to deterministic legacy allocation for rows without origin link.
 */
export const sumReturnsByOriginalItemId = <
  TOriginal extends DispatchRowLike,
  TReturn extends ReturnRowWithOptionalOriginLike,
>(
  originalItems: TOriginal[],
  returnItems: TReturn[],
): Map<number, number> => {
  const totalsByOriginalId = new Map<number, number>();

  for (const original of originalItems) {
    totalsByOriginalId.set(original.DOUId, 0);
  }

  const legacyReturnRows: Omit<DispatchRowLike, "DOUId">[] = [];

  for (const returned of returnItems) {
    if (returned.DOUOriginalItemId != null) {
      const current = totalsByOriginalId.get(returned.DOUOriginalItemId) ?? 0;
      totalsByOriginalId.set(
        returned.DOUOriginalItemId,
        current + Number(returned.DOUCantidad),
      );
      continue;
    }

    legacyReturnRows.push({
      DOUInvcaruniId: returned.DOUInvcaruniId,
      DOULote: returned.DOULote,
      DOUNroDocumento: returned.DOUNroDocumento,
      DOUCantidad: Number(returned.DOUCantidad),
    });
  }

  if (legacyReturnRows.length > 0) {
    const legacyAllocated = calculateReturnedQuantityByOriginalRow(
      originalItems,
      legacyReturnRows,
    );

    for (const [originalId, qty] of legacyAllocated) {
      const current = totalsByOriginalId.get(originalId) ?? 0;
      totalsByOriginalId.set(originalId, current + qty);
    }
  }

  return totalsByOriginalId;
};
