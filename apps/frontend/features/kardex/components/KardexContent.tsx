"use client";

import { useMemo, useState } from "react";

import { DashboardFilterBar } from "@/components/shared/DashboardFilterBar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { KardexDataFilters } from "@/features/inventory";

import {
  mapSummaryToKardexProduct,
  useKardexLots,
  useKardexMovements,
  useKardexProducts,
} from "../hooks/useKardexDashboard";
import type { KardexProduct } from "../schemas/KardexSchemas";
import { LotDetailTable } from "./LotDetailTable";
import { ProductSummaryTable } from "./ProductSummaryTable";
import { TransactionLogTable } from "./TransactionLogTable";

const PAGE_LIMIT = 10;

const initialFilters: KardexDataFilters = {
  product: "All",
  invcaruniId: null,
  group: "All",
  country: "All",
};

function parseProductId(productId: string): { code: string; name: string } {
  const sep = productId.indexOf("|");
  if (sep === -1) {
    return { code: "", name: productId };
  }
  return {
    code: productId.slice(0, sep),
    name: productId.slice(sep + 1),
  };
}

function productFromId(id: string, invcaruniId: number): KardexProduct {
  const { code, name } = parseProductId(id);
  return {
    id,
    invcaruniId,
    code,
    name,
    group: "",
    unit: "UN",
    country: "",
    salesPrice: 0,
    invIni: 0,
    inputs: 0,
    inputsUSD: 0,
    outputs: 0,
    outputsUSD: 0,
    invEnd: 0,
    avgCost: 0,
    lastCost: 0,
    stockValue: 0,
    totalValueLastCost: 0,
    minStock: 0,
  };
}

export function KardexContent() {
  const [dataFilters, setDataFilters] =
    useState<KardexDataFilters>(initialFilters);

  // The product table is the page's primary entity: its page lives in the URL.
  // Lot and transaction tables are drill-down views with local state.
  const { currentPage: productPage, setPage: setProductPage } =
    useDebouncedTableParams();
  const [lotPage, setLotPage] = useState(1);
  const [movPage, setMovPage] = useState(1);
  const [lotSearchInput, setLotSearchInput] = useState("");
  const [movSearchInput, setMovSearchInput] = useState("");
  const lotSearch = useDebouncedValue(lotSearchInput, 300);
  const movSearch = useDebouncedValue(movSearchInput, 300);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedInvcaruniId, setSelectedInvcaruniId] = useState<number | null>(
    null,
  );
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  const drillDownProductName = useMemo(
    () =>
      selectedProductId ? parseProductId(selectedProductId).name : null,
    [selectedProductId],
  );

  const productListFilters = useMemo(
    () => ({
      dateRange: "6m" as const,
      country: dataFilters.country,
      product: dataFilters.product,
      invcaruniId: dataFilters.invcaruniId,
      group: dataFilters.group,
    }),
    [dataFilters],
  );

  // Lots are scoped to the table-selected product (preferring its exact ID
  // over the name so duplicated names stay unambiguous).
  const lotScopedFilters = useMemo(
    () => ({
      ...productListFilters,
      product: drillDownProductName ?? productListFilters.product,
      invcaruniId: selectedInvcaruniId ?? productListFilters.invcaruniId,
    }),
    [productListFilters, drillDownProductName, selectedInvcaruniId],
  );

  const productsQuery = useKardexProducts({
    ...productListFilters,
    productPage,
    productLimit: PAGE_LIMIT,
    lotPage: 1,
    lotLimit: 1,
  });

  const lotsQuery = useKardexLots({
    ...lotScopedFilters,
    productPage: 1,
    productLimit: 1,
    lotPage,
    lotLimit: PAGE_LIMIT,
    lotSearch,
  });

  const products = productsQuery.data;
  const lots = lotsQuery.data;

  const activeProduct = useMemo(() => {
    if (!selectedProductId) return null;

    const fromPage = products?.products.find((p) => p.id === selectedProductId);
    if (fromPage) return fromPage;

    const summary = products?.summaries.find(
      (p) => p.id === selectedProductId,
    );
    if (summary) return mapSummaryToKardexProduct(summary);

    return productFromId(selectedProductId, selectedInvcaruniId ?? 0);
  }, [selectedProductId, products, selectedInvcaruniId]);

  const selectedLotRow = useMemo(() => {
    if (!selectedLotId) return null;
    return lots?.lots.find((l) => l.id === selectedLotId) ?? null;
  }, [selectedLotId, lots]);

  const selectedLotLabel = selectedLotRow
    ? `${selectedLotRow.lote} (${selectedLotRow.documento}) — ${selectedLotRow.productName}`
    : null;

  const movementsQuery = useKardexMovements(
    useMemo(() => {
      const effectiveInvcaruniId =
        selectedInvcaruniId ?? dataFilters.invcaruniId;
      return {
        page: movPage,
        limit: PAGE_LIMIT,
        search: movSearch.trim() || undefined,
        group: dataFilters.group !== "All" ? dataFilters.group : undefined,
        country:
          dataFilters.country !== "All" ? dataFilters.country : undefined,
        ...(selectedLotRow
          ? { kardexLoteId: Number(selectedLotRow.id) }
          : effectiveInvcaruniId != null
            ? { invcaruniId: effectiveInvcaruniId }
            : {}),
      };
    }, [
      movPage,
      movSearch,
      selectedLotRow,
      selectedInvcaruniId,
      dataFilters.invcaruniId,
      dataFilters.group,
      dataFilters.country,
    ]),
  );

  const resetDrillDownPages = () => {
    setLotPage(1);
    setMovPage(1);
    setLotSearchInput("");
  };

  const handleFiltersChange = (next: KardexDataFilters) => {
    setDataFilters(next);
    setProductPage(1);
    resetDrillDownPages();
  };

  const handleResetFilters = () => {
    handleFiltersChange(initialFilters);
  };

  const handleSelectProduct = (
    id: string | null,
    invcaruniId?: number | null,
  ) => {
    setSelectedProductId(id);
    setSelectedLotId(null);
    resetDrillDownPages();
    if (!id) {
      setSelectedInvcaruniId(null);
      return;
    }
    const fromPage = products?.products.find((p) => p.id === id);
    const summary = products?.summaries.find((p) => p.id === id);
    setSelectedInvcaruniId(
      invcaruniId ?? fromPage?.invcaruniId ?? summary?.invcaruniId ?? null,
    );
  };

  const handleSelectLot = (lotId: string | null) => {
    setSelectedLotId(lotId);
    setMovPage(1);
  };

  const isInitialLoad =
    (productsQuery.isLoading && !products) || (lotsQuery.isLoading && !lots);
  const isInitialMovementsLoad =
    movementsQuery.isLoading && !movementsQuery.data;

  const dashboardError = productsQuery.error ?? lotsQuery.error;
  if (dashboardError) {
    return (
      <ErrorBoundary error={dashboardError} entityName="Kardex dashboard" />
    );
  }

  if (isInitialLoad) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Loading kardex dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">Kardex Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Drill into products, lots and individual stock movements
        </p>
      </div>

      <DashboardFilterBar
        filters={dataFilters}
        onFiltersChange={handleFiltersChange}
        onReset={handleResetFilters}
      />

      <div className="flex flex-col gap-8">
        <ProductSummaryTable
          products={products?.products ?? []}
          totals={
            products?.totals ?? {
              invIni: 0,
              inputs: 0,
              inputsUSD: 0,
              outputs: 0,
              outputsUSD: 0,
              invEnd: 0,
              stockValue: 0,
              totalValueLastCost: 0,
            }
          }
          selectedProduct={selectedProductId}
          onSelectProduct={handleSelectProduct}
          isFetching={productsQuery.isFetching}
          serverPagination={{
            page: products?.pagination.page ?? 1,
            totalPages: products?.pagination.totalPages ?? 1,
            totalItems: products?.pagination.totalItems ?? 0,
            onPageChange: setProductPage,
          }}
        />

        <LotDetailTable
          lots={lots?.lots ?? []}
          selectedProductData={activeProduct}
          selectedLot={selectedLotId}
          onSelectLot={handleSelectLot}
          isFetching={lotsQuery.isFetching}
          searchQuery={lotSearchInput}
          onSearchChange={(q) => {
            setLotSearchInput(q);
            setLotPage(1);
          }}
          serverPagination={{
            page: lots?.pagination.page ?? 1,
            totalPages: lots?.pagination.totalPages ?? 1,
            totalItems: lots?.pagination.totalItems ?? 0,
            onPageChange: setLotPage,
          }}
        />

        <TransactionLogTable
          transactions={movementsQuery.data?.transactions ?? []}
          selectedProduct={selectedProductId}
          selectedLotLabel={selectedLotLabel}
          searchQuery={movSearchInput}
          onSearchChange={(q) => {
            setMovSearchInput(q);
            setMovPage(1);
          }}
          isLoading={isInitialMovementsLoad}
          isFetching={movementsQuery.isFetching}
          serverPagination={
            movementsQuery.data
              ? {
                  page: movementsQuery.data.pagination.page,
                  totalPages: movementsQuery.data.pagination.totalPages,
                  totalItems: movementsQuery.data.pagination.totalItems,
                  pageSize: PAGE_LIMIT,
                  onPageChange: setMovPage,
                }
              : undefined
          }
        />
        {movementsQuery.isError ? (
          <p className="px-1 text-xs text-muted-foreground">
            Some movement data could not be loaded.
          </p>
        ) : null}
      </div>
    </div>
  );
}
