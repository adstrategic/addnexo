import assert from "node:assert/strict";
import test from "node:test";

import { computeItemDio, computeWeightedGlobalDio } from "./dio.js";

void test("computeItemDio calculates DIO from opening/ending and outflow", () => {
  const dio = computeItemDio({
    openingStockUnits: 100,
    endingStockUnits: 80,
    outflowUnitsInPeriod: 60,
    periodDays: 30,
  });

  assert.equal(dio, 45);
});

void test("computeItemDio returns null when outflow is zero", () => {
  const dio = computeItemDio({
    openingStockUnits: 100,
    endingStockUnits: 80,
    outflowUnitsInPeriod: 0,
    periodDays: 30,
  });

  assert.equal(dio, null);
});

void test("computeWeightedGlobalDio ignores rows with null dio", () => {
  const globalDio = computeWeightedGlobalDio([
    { dio: 10, stock: 100 },
    { dio: null, stock: 50 },
    { dio: 20, stock: 100 },
  ]);

  assert.equal(globalDio, 15);
});

void test("computeWeightedGlobalDio returns null when no valid dio", () => {
  const globalDio = computeWeightedGlobalDio([
    { dio: null, stock: 100 },
    { dio: null, stock: 50 },
  ]);

  assert.equal(globalDio, null);
});
