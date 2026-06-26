export interface ComputeItemDioInput {
  endingStockUnits: number;
  openingStockUnits: number;
  outflowUnitsInPeriod: number;
  periodDays: number;
}

export const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const computeItemDio = (
  input: ComputeItemDioInput,
): null | number => {
  const { openingStockUnits, endingStockUnits, outflowUnitsInPeriod, periodDays } =
    input;

  if (periodDays <= 0) {
    return null;
  }

  const dailyOutflowUnits = outflowUnitsInPeriod / periodDays;
  if (dailyOutflowUnits <= 0) {
    return null;
  }

  const avgInventoryUnits = (openingStockUnits + endingStockUnits) / 2;
  if (avgInventoryUnits < 0) {
    return null;
  }

  return roundTo(avgInventoryUnits / dailyOutflowUnits, 2);
};

export const computeWeightedGlobalDio = (
  rows: { dio: null | number; stock: number }[],
): null | number => {
  let weighted = 0;
  let stockWeight = 0;

  for (const row of rows) {
    if (row.dio === null || row.stock <= 0) {
      continue;
    }
    weighted += row.dio * row.stock;
    stockWeight += row.stock;
  }

  if (stockWeight <= 0) {
    return null;
  }

  return roundTo(weighted / stockWeight, 2);
};
