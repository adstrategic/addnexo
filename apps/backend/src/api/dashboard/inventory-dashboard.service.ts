import { Prisma, prisma } from "@repo/db";

import type { InventoryDashboardQueryDto } from "./dashboard.validator.js";

import { computeItemDio, computeWeightedGlobalDio, roundTo } from "./dio.js";

export interface InventoryDashboardRow {
  code: string;
  countryOfOrigin: string;
  dio: number;
  group: string;
  id: string;
  inputs: number;
  invIni: number;
  lot: string;
  measurementUnit?: string;
  minStock: number;
  outputs: number;
  product: string;
  purchaseDate: string;
  stock: number;
  totalValueUSD: number;
  unitCostUSD: number;
}

export interface InventoryKardexTableRow {
  avgCost: number;
  code: string;
  group: string;
  id: string;
  invEnd: number;
  lastCost: number;
  minStock: number;
  product: string;
  totalValueAvgCost: number;
  totalValueLastCost: number;
  unit: string;
}

export interface InventoryProductSummary {
  avgCost: number;
  code: string;
  country: string;
  entryUnitCost: number;
  group: string;
  id: string;
  inputs: number;
  inputsUSD: number;
  invcaruniId: number;
  invEnd: number;
  invIni: number;
  lastCost: number;
  minStock: number;
  outputs: number;
  outputsUSD: number;
  product: string;
  stockValue: number;
  totalValueEntryCost: number;
  totalValueLastCost: number;
  unit: string;
}

export interface InventoryDashboardResponse {
  filterOptions: {
    countries: string[];
    groups: string[];
    products: string[];
  };
  kardexTableRows: InventoryKardexTableRow[];
  kpis: {
    avgCostUsd: number;
    deltas: {
      avgCostUsd: number;
      globalDio: number;
      stockUnits: number;
      totalValueAtAvgCostUsd: number;
      totalValueAtEntryCostUsd: number;
      totalValueUsd: number;
    };
    globalDio: number;
    stockUnits: number;
    totalValueAtAvgCostUsd: number;
    totalValueAtEntryCostUsd: number;
    totalValueUsd: number;
  };
  lotBreakdownTotals: {
    inputs: number;
    invEnd: number;
    invIni: number;
    outputs: number;
  };
  originBreakdown: { country: string; percentage: number; stock: number; }[];
  pagination: {
    lots: {
      limit: number;
      page: number;
      totalItems: number;
      totalPages: number;
    };
    products: {
      limit: number;
      page: number;
      totalItems: number;
      totalPages: number;
    };
  };
  productSummaries: InventoryProductSummary[];
  productSummariesTotals: {
    inputs: number;
    inputsUSD: number;
    invEnd: number;
    invIni: number;
    outputs: number;
    outputsUSD: number;
    stockValue: number;
    totalValueLastCost: number;
  };
  rows: InventoryDashboardRow[];
}

interface InventoryDashboardParams extends InventoryDashboardQueryDto {
  ano: number;
  mes: number;
  organizationId: string;
}

const getPeriodDays = (
  dateRange: InventoryDashboardQueryDto["dateRange"],
): number => {
  if (dateRange === "30d") return 30;
  if (dateRange === "60d") return 60;
  if (dateRange === "90d") return 90;
  if (dateRange === "1y") return 365;
  return 180;
};

const buildStockKey = (productId: number, almacenId: number): string =>
  `${String(productId)}:${String(almacenId)}`;

const invcaruniSelect = {
  CKCodigo: true,
  CKDescripcion: true,
  grupo: { select: { GDescripcion: true } },
  origenPais: { select: { nombre: true } },
  unidadDeMedida: { select: { UMNombre: true, UMDescripcion: true } },
} satisfies Prisma.InvcaruniSelect;

const buildInvcaruniWhere = (
  params: InventoryDashboardParams,
): Prisma.InvcaruniWhereInput => {
  const { invcaruniId, product, group, country } = params;
  return {
    // When a specific product ID is provided prefer it over the name string —
    // avoids matching multiple products that share the same CKDescripcion.
    ...(invcaruniId
      ? { CKId: invcaruniId }
      : product !== "All"
        ? { CKDescripcion: product }
        : {}),
    ...(group !== "All" ? { grupo: { GDescripcion: group } } : {}),
    ...(country !== "All" ? { origenPais: { nombre: country } } : {}),
  };
};

type KardexRowWithProduct = Prisma.KardexGetPayload<{
  include: { invcaruni: { select: typeof invcaruniSelect } };
}>;

/**
 * Net in/out movement flows per product/warehouse within the rotation window,
 * used as the consumption rate for DIO.
 */
const fetchMovementFlows = async (
  organizationId: string,
  kardexRows: KardexRowWithProduct[],
  periodDays: number,
): Promise<Map<string, { inflow: number; outflow: number }>> => {
  const productIds = Array.from(new Set(kardexRows.map((k) => k.KInvcaruniId)));
  const almacenIds = Array.from(new Set(kardexRows.map((k) => k.KAlmacenId)));

  const flows = new Map<string, { inflow: number; outflow: number }>();
  if (productIds.length === 0 || almacenIds.length === 0) {
    return flows;
  }

  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - periodDays);

  const movimientos = await prisma.movkar.findMany({
    where: {
      MVOrganizationId: organizationId,
      MVInvcaruniId: { in: productIds },
      MVAlmacenId: { in: almacenIds },
      MVFecha: { gte: cutoff, lte: now },
      tmovkar: { TTipo: { in: [1, 2] } },
    },
    select: {
      MVInvcaruniId: true,
      MVAlmacenId: true,
      MVCantidad: true,
      tmovkar: { select: { TTipo: true } },
    },
  });

  for (const mov of movimientos) {
    const key = buildStockKey(mov.MVInvcaruniId, mov.MVAlmacenId);
    const current = flows.get(key) ?? { inflow: 0, outflow: 0 };
    if (mov.tmovkar.TTipo === 1) {
      current.inflow += Number(mov.MVCantidad);
    } else if (mov.tmovkar.TTipo === 2) {
      current.outflow += Number(mov.MVCantidad);
    }
    flows.set(key, current);
  }

  return flows;
};

const computeDioByProductAlmacen = (
  kardexRows: KardexRowWithProduct[],
  flows: Map<string, { inflow: number; outflow: number }>,
  periodDays: number,
): Map<string, { dio: null | number; endingStock: number }> => {
  // Ending stock per product/warehouse comes straight from Kardex; lots for the
  // same key always sum to KExistenciaFin (month-close invariant).
  const stockByKey = new Map<string, number>();
  for (const kardex of kardexRows) {
    const key = buildStockKey(kardex.KInvcaruniId, kardex.KAlmacenId);
    stockByKey.set(
      key,
      (stockByKey.get(key) ?? 0) + Number(kardex.KExistenciaFin),
    );
  }

  const dioByKey = new Map<string, { dio: null | number; endingStock: number }>();
  stockByKey.forEach((endingStock, key) => {
    const flow = flows.get(key) ?? { inflow: 0, outflow: 0 };
    const openingStock = Math.max(endingStock - flow.inflow + flow.outflow, 0);
    const dio = computeItemDio({
      openingStockUnits: openingStock,
      endingStockUnits: endingStock,
      outflowUnitsInPeriod: flow.outflow,
      periodDays,
    });
    dioByKey.set(key, { dio, endingStock });
  });

  return dioByKey;
};

/**
 * Aggregates Kardex rows by product (sums across multiple warehouses for the
 * same product). stockValue and totalValueLastCost are computed as
 * KExistenciaFin × cost — the correct ending inventory value — not from the
 * pre-stored KLValorCosto* fields which represent entry costs and lose their
 * meaning on opening-balance rows created by month-close.
 *
 * Kept in memory on purpose: the grouping needs relation fields (group,
 * country, unit), last-row-wins unit costs and a max() over minStock — none of
 * which prisma.groupBy can express. The dataset is bounded by catalog size ×
 * warehouses for a single period.
 */
const buildProductSummaries = (
  kardexRows: KardexRowWithProduct[],
): InventoryProductSummary[] => {
  const summaryMap = new Map<
    string,
    {
      code: string;
      country: string;
      group: string;
      id: string;
      inputs: number;
      inputsUSD: number;
      invcaruniId: number;
      invEnd: number;
      invIni: number;
      minStock: number;
      outputs: number;
      outputsUSD: number;
      product: string;
      stockValue: number;
      totalValueLastCost: number;
      unit: string;
      unitAvgCost: number;
      unitLastCost: number;
    }
  >();

  for (const kardex of kardexRows) {
    const code = String(kardex.invcaruni.CKCodigo);
    const productName = kardex.invcaruni.CKDescripcion;
    const productKey = `${code}|${productName}`;

    const existing = summaryMap.get(productKey) ?? {
      id: productKey,
      invcaruniId: kardex.KInvcaruniId,
      code,
      product: productName,
      group: kardex.invcaruni.grupo.GDescripcion,
      unit:
        kardex.invcaruni.unidadDeMedida.UMNombre ||
        kardex.invcaruni.unidadDeMedida.UMDescripcion ||
        "UN",
      country: kardex.invcaruni.origenPais.nombre,
      invIni: 0,
      inputs: 0,
      inputsUSD: 0,
      outputs: 0,
      outputsUSD: 0,
      invEnd: 0,
      stockValue: 0,
      totalValueLastCost: 0,
      minStock: 0,
      unitAvgCost: 0,
      unitLastCost: 0,
    };

    existing.invIni += Number(kardex.KExistenciaInicial);
    existing.inputs += Number(kardex.KEntradas);
    existing.inputsUSD += Number(kardex.KValorEntradas);
    existing.outputs += Number(kardex.KSalidas);
    existing.outputsUSD += Number(kardex.KValorSalidas);
    existing.invEnd += Number(kardex.KExistenciaFin);
    existing.stockValue += Number(kardex.KLValorCostoPromedio);
    existing.totalValueLastCost += Number(kardex.KLValorCostoUltimo);
    existing.minStock = Math.max(existing.minStock, kardex.KExistenciaMin);
    existing.unitAvgCost = Number(kardex.KCostoPromedio);
    existing.unitLastCost = Number(kardex.KCostoUltimo);
    summaryMap.set(productKey, existing);
  }

  return Array.from(summaryMap.values()).map((item) => {
    const inputs = roundTo(item.inputs, 2);
    const inputsUSD = roundTo(item.inputsUSD, 2);
    return {
      id: item.id,
      invcaruniId: item.invcaruniId,
      code: item.code,
      product: item.product,
      group: item.group,
      unit: item.unit,
      country: item.country,
      invIni: roundTo(item.invIni, 2),
      inputs,
      inputsUSD,
      outputs: roundTo(item.outputs, 2),
      outputsUSD: roundTo(item.outputsUSD, 2),
      invEnd: roundTo(item.invEnd, 2),
      entryUnitCost: inputs > 0 ? roundTo(inputsUSD / inputs, 2) : 0,
      avgCost: roundTo(item.unitAvgCost, 2),
      lastCost: roundTo(item.unitLastCost, 2),
      totalValueEntryCost: inputsUSD,
      stockValue: roundTo(item.stockValue, 2),
      totalValueLastCost: roundTo(item.totalValueLastCost, 2),
      minStock: roundTo(item.minStock, 2),
    };
  });
};

const sumProductSummariesTotals = (items: InventoryProductSummary[]) => ({
  invIni: roundTo(items.reduce((acc, p) => acc + p.invIni, 0), 2),
  inputs: roundTo(items.reduce((acc, p) => acc + p.inputs, 0), 2),
  inputsUSD: roundTo(items.reduce((acc, p) => acc + p.inputsUSD, 0), 2),
  outputs: roundTo(items.reduce((acc, p) => acc + p.outputs, 0), 2),
  outputsUSD: roundTo(items.reduce((acc, p) => acc + p.outputsUSD, 0), 2),
  invEnd: roundTo(items.reduce((acc, p) => acc + p.invEnd, 0), 2),
  stockValue: roundTo(items.reduce((acc, p) => acc + p.stockValue, 0), 2),
  totalValueLastCost: roundTo(
    items.reduce((acc, p) => acc + p.totalValueLastCost, 0),
    2,
  ),
});

/**
 * Lot table page, count and footer totals — all pushed to the database so the
 * lot dataset is never materialized in memory.
 *
 * Search matches KLLote OR KLNroDocumento (the UI shows them joined as
 * "LOTE-DOC"; a search string spanning the hyphen no longer matches).
 */
const fetchLotPage = async (
  params: InventoryDashboardParams,
  invcaruniWhere: Prisma.InvcaruniWhereInput,
) => {
  const { organizationId, mes, ano, lotSearch, lotPage, lotLimit } = params;

  const lotSearchQuery = lotSearch.trim();
  const where: Prisma.KardexLoteWhereInput = {
    KLOrganizationId: organizationId,
    KLMes: mes,
    KLAno: ano,
    invcaruni: invcaruniWhere,
    ...(lotSearchQuery
      ? {
          OR: [
            { KLLote: { contains: lotSearchQuery, mode: "insensitive" } },
            {
              KLNroDocumento: {
                contains: lotSearchQuery,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [totalItems, sums] = await prisma.$transaction([
    prisma.kardexLote.count({ where }),
    prisma.kardexLote.aggregate({
      where,
      _sum: {
        KLExistenciaInicial: true,
        KLEntradas: true,
        KLSalidas: true,
        KLExistenciaFin: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / lotLimit));
  const safePage = Math.min(Math.max(1, lotPage), totalPages);

  const lotes = await prisma.kardexLote.findMany({
    where,
    skip: (safePage - 1) * lotLimit,
    take: lotLimit,
    orderBy: [
      { KLFechaUltimaEntrada: { sort: "desc", nulls: "last" } },
      { KLId: "desc" },
    ],
    include: {
      kardex: { select: { KExistenciaMin: true } },
      invcaruni: { select: invcaruniSelect },
    },
  });

  return {
    lotes,
    totals: {
      invIni: roundTo(Number(sums._sum.KLExistenciaInicial ?? 0), 2),
      inputs: roundTo(Number(sums._sum.KLEntradas ?? 0), 2),
      outputs: roundTo(Number(sums._sum.KLSalidas ?? 0), 2),
      invEnd: roundTo(Number(sums._sum.KLExistenciaFin ?? 0), 2),
    },
    pagination: {
      page: safePage,
      limit: lotLimit,
      totalItems,
      totalPages,
    },
  };
};

export const getInventoryDashboard = async (
  params: InventoryDashboardParams,
): Promise<InventoryDashboardResponse> => {
  const {
    organizationId,
    mes,
    ano,
    search,
    dateRange,
    productPage,
    productLimit,
  } = params;
  const periodDays = getPeriodDays(dateRange);
  const invcaruniWhere = buildInvcaruniWhere(params);

  const kardexRows = await prisma.kardex.findMany({
    where: {
      KOrganizationId: organizationId,
      KMes: mes,
      KAno: ano,
      invcaruni: invcaruniWhere,
    },
    include: { invcaruni: { select: invcaruniSelect } },
  });

  const filterOptions = {
    countries: Array.from(
      new Set(kardexRows.map((k) => k.invcaruni.origenPais.nombre)),
    ).sort(),
    products: Array.from(
      new Set(kardexRows.map((k) => k.invcaruni.CKDescripcion)),
    ).sort(),
    groups: Array.from(
      new Set(kardexRows.map((k) => k.invcaruni.grupo.GDescripcion)),
    ).sort(),
  };

  const [flows, lotPageResult] = await Promise.all([
    fetchMovementFlows(organizationId, kardexRows, periodDays),
    fetchLotPage(params, invcaruniWhere),
  ]);
  const dioByProductAlmacen = computeDioByProductAlmacen(
    kardexRows,
    flows,
    periodDays,
  );

  const rows: InventoryDashboardRow[] = lotPageResult.lotes.map((lote) => {
    const stock = Number(lote.KLExistenciaFin);
    const unitCostUSD = Number(lote.KLCostoPromedio);
    const stockKey = buildStockKey(lote.KLInvcaruniId, lote.KAlmacenId);
    const rowDio = dioByProductAlmacen.get(stockKey)?.dio ?? null;

    return {
      id: String(lote.KLId),
      code: String(lote.invcaruni.CKCodigo),
      product: lote.invcaruni.CKDescripcion,
      group: lote.invcaruni.grupo.GDescripcion,
      lot: `${lote.KLLote}-${lote.KLNroDocumento}`,
      invIni: roundTo(Number(lote.KLExistenciaInicial), 2),
      inputs: Number(lote.KLEntradas),
      outputs: Number(lote.KLSalidas),
      stock: roundTo(stock, 2),
      purchaseDate: lote.KLFechaUltimaEntrada
        ? lote.KLFechaUltimaEntrada.toISOString().slice(0, 10)
        : "",
      countryOfOrigin: lote.invcaruni.origenPais.nombre,
      unitCostUSD: roundTo(unitCostUSD, 2),
      totalValueUSD: roundTo(stock * unitCostUSD, 2),
      minStock: lote.kardex.KExistenciaMin,
      dio: rowDio ?? 0,
      measurementUnit:
        lote.invcaruni.unidadDeMedida.UMNombre ||
        lote.invcaruni.unidadDeMedida.UMDescripcion ||
        undefined,
    };
  });

  const allProductSummaries = buildProductSummaries(kardexRows);

  // KPIs sourced from Kardex-based product summaries for consistency
  const stockUnits = roundTo(
    allProductSummaries.reduce((acc, p) => acc + p.invEnd, 0),
    2,
  );
  const totalValueAtAvgCostUsd = roundTo(
    allProductSummaries.reduce((acc, p) => acc + p.stockValue, 0),
    2,
  );
  const totalValueAtEntryCostUsd = roundTo(
    allProductSummaries.reduce((acc, p) => acc + p.inputsUSD, 0),
    2,
  );
  const avgCostUsd =
    stockUnits > 0 ? roundTo(totalValueAtAvgCostUsd / stockUnits, 2) : 0;
  const globalDio = computeWeightedGlobalDio(
    Array.from(dioByProductAlmacen.values()).map(({ dio, endingStock }) => ({
      dio: dio !== null && dio > 0 ? dio : null,
      stock: endingStock,
    })),
  );

  const originMap = new Map<string, number>();
  for (const kardex of kardexRows) {
    const country = kardex.invcaruni.origenPais.nombre;
    originMap.set(
      country,
      (originMap.get(country) ?? 0) + Number(kardex.KExistenciaFin),
    );
  }
  const originBreakdown = Array.from(originMap.entries())
    .map(([country, stock]) => ({
      country,
      stock: roundTo(stock, 2),
      percentage: stockUnits > 0 ? roundTo((stock / stockUnits) * 100, 2) : 0,
    }))
    .sort((a, b) => b.stock - a.stock);

  const searchQuery = search.trim().toLowerCase();
  const filteredProductSummaries = searchQuery
    ? allProductSummaries.filter(
        (p) =>
          p.product.toLowerCase().includes(searchQuery) ||
          p.code.toLowerCase().includes(searchQuery) ||
          p.group.toLowerCase().includes(searchQuery),
      )
    : allProductSummaries;

  const totalProductItems = filteredProductSummaries.length;
  const totalProductPages = Math.max(
    1,
    Math.ceil(totalProductItems / productLimit),
  );
  const safeProductPage = Math.min(Math.max(1, productPage), totalProductPages);
  const productStart = (safeProductPage - 1) * productLimit;
  const productSummaries = filteredProductSummaries.slice(
    productStart,
    productStart + productLimit,
  );

  // Footer totals: full filtered dataset (not the current page slice)
  const productSummariesTotals = sumProductSummariesTotals(
    filteredProductSummaries,
  );

  // Product-scoped kardex table (inventory UI); independent of lot page
  const kardexTableRows: InventoryKardexTableRow[] = productSummaries.map(
    (item) => ({
      id: item.id,
      code: item.code,
      product: item.product,
      group: item.group,
      unit: item.unit,
      invEnd: item.invEnd,
      avgCost: item.avgCost,
      lastCost: item.lastCost,
      totalValueAvgCost: item.stockValue,
      totalValueLastCost: item.totalValueLastCost,
      minStock: item.minStock,
    }),
  );

  return {
    kpis: {
      stockUnits,
      totalValueUsd: totalValueAtAvgCostUsd,
      avgCostUsd,
      totalValueAtAvgCostUsd,
      totalValueAtEntryCostUsd,
      globalDio: globalDio ?? 0,
      deltas: {
        stockUnits: 0,
        totalValueUsd: 0,
        avgCostUsd: 0,
        totalValueAtAvgCostUsd: 0,
        totalValueAtEntryCostUsd: 0,
        globalDio: 0,
      },
    },
    rows,
    kardexTableRows,
    productSummaries,
    productSummariesTotals,
    lotBreakdownTotals: lotPageResult.totals,
    originBreakdown,
    filterOptions,
    pagination: {
      products: {
        page: safeProductPage,
        limit: productLimit,
        totalItems: totalProductItems,
        totalPages: totalProductPages,
      },
      lots: lotPageResult.pagination,
    },
  };
};
