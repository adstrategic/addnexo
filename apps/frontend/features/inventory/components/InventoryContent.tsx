"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Coins, Download, Package, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardFilterBar } from "@/components/shared/DashboardFilterBar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";

import { useInventoryDashboard } from "../hooks/useInventoryDashboard";
import type {
  KardexDataFilters,
  KPIMetric,
} from "../schemas/InventorySchemas";
import { InventoryKpiCard } from "./InventoryKpiCard";
import { InventoryTable } from "./InventoryTable";
import { OriginDonut } from "./OriginDonut";
import { RotationChart } from "./RotationChart";

const PRODUCT_PAGE_LIMIT = 10;

const initialFilters: KardexDataFilters = {
  country: "All",
  product: "All",
  invcaruniId: null,
  group: "All",
};

const formatUsdKpi = (value: number) =>
  `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-xl bg-muted" />
        <Skeleton className="h-[380px] rounded-xl bg-muted" />
      </div>
      <Skeleton className="h-[400px] rounded-xl bg-muted" />
    </div>
  );
}

export function InventoryContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();
  const [filters, setFilters] = useState<KardexDataFilters>(initialFilters);

  const { data, isLoading, error, refetch } = useInventoryDashboard({
    dateRange: "6m",
    country: filters.country,
    product: filters.product,
    invcaruniId: filters.invcaruniId,
    group: filters.group,
    search: debouncedSearch,
    productPage: currentPage,
    productLimit: PRODUCT_PAGE_LIMIT,
    lotPage: 1,
    lotLimit: 10,
  });

  // Drop selected filter values that no longer exist in the filtered dataset
  // (e.g. after switching periods).
  const filterOptions = data?.filterOptions;
  useEffect(() => {
    if (!filterOptions) return;
    setFilters((prev) => {
      const next = { ...prev };
      if (
        prev.country !== "All" &&
        !filterOptions.countries.includes(prev.country)
      ) {
        next.country = "All";
      }
      if (
        prev.product !== "All" &&
        !filterOptions.products.includes(prev.product)
      ) {
        next.product = "All";
        next.invcaruniId = null;
      }
      if (prev.group !== "All" && !filterOptions.groups.includes(prev.group)) {
        next.group = "All";
      }
      return next;
    });
  }, [filterOptions]);

  const metrics = useMemo((): KPIMetric[] => {
    const kpis = data?.kpis;
    const kardexTableRows = data?.kardexTableRows ?? [];
    // Parity quirk inherited from the old dashboard: the "last cost" KPI shows
    // the footer total (productSummariesTotals.totalValueLastCost), not
    // kpis.totalValueAtEntryCostUsd.
    const totalValueLastCost = data?.productSummariesTotals.totalValueLastCost ?? 0;
    const selectedUnit =
      filters.product !== "All"
        ? kardexTableRows.find((row) => row.product === filters.product)?.unit
        : undefined;

    return [
      {
        title: "Stock Units",
        value: (kpis?.stockUnits ?? 0).toLocaleString(),
        delta: kpis?.deltas.stockUnits ?? 0,
        unit: selectedUnit,
        tooltip:
          "Total quantity on hand for your current filters. When one product is selected, the unit shown (e.g. kg) matches that product.",
        icon: Package,
      },
      {
        title: "Total inventory at avg cost",
        value: formatUsdKpi(kpis?.totalValueAtAvgCostUsd ?? 0),
        delta: kpis?.deltas.totalValueAtAvgCostUsd ?? 0,
        tooltip:
          "Estimated value of stock on hand using each product's average unit cost, then summed across products.",
        icon: Coins,
      },
      {
        title: "Total inventory at last cost",
        value: formatUsdKpi(totalValueLastCost),
        delta: kpis?.deltas.totalValueAtEntryCostUsd ?? 0,
        tooltip:
          "Inventory valued at last purchase cost — ending stock × last unit cost per product.",
        icon: Coins,
      },
      {
        title: "Global DIO",
        value: (kpis?.globalDio ?? 0).toFixed(1),
        delta: kpis?.deltas.globalDio ?? 0,
        unit: "days",
        tooltip:
          "Days Inventory Outstanding — how many days it would take to sell through current stock at recent outbound volume. Lower means faster turnover; perishables often target under 10 days.",
        icon: Clock,
      },
    ];
  }, [data, filters.product]);

  const handleSetFilters = (next: KardexDataFilters) => {
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch("");
  };

  if (error) {
    return <ErrorBoundary error={error} entityName="Inventory dashboard" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your products, stock, and rotation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Download size={16} className="mr-2" /> Export
          </Button>
          <Button size="sm" onClick={() => void refetch()}>
            <RefreshCw size={16} className="mr-2" />
            Reload
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <DashboardFilterBar
          filters={filters}
          onFiltersChange={handleSetFilters}
          onReset={resetFilters}
        />

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, idx) => (
                <InventoryKpiCard key={metric.title} metric={metric} delay={idx * 100} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 xl:col-span-4">
                <OriginDonut
                  originBreakdown={data?.originBreakdown ?? []}
                  onCountryClick={(country) =>
                    handleSetFilters({ ...filters, country })
                  }
                />
              </div>
              <div className="lg:col-span-7 xl:col-span-8">
                <RotationChart data={data?.rows ?? []} />
              </div>
            </div>

            <div className="pb-6">
              <h2 className="mb-3 ml-1 text-lg font-bold text-foreground">
                Kardex de Inventario
              </h2>
              <InventoryTable
                data={data?.kardexTableRows ?? []}
                footerTotals={{
                  invEnd: data?.productSummariesTotals.invEnd ?? 0,
                  totalValueAvgCost: data?.productSummariesTotals.stockValue ?? 0,
                  totalValueLastCost:
                    data?.productSummariesTotals.totalValueLastCost ?? 0,
                }}
                searchTerm={searchTerm}
                onSearchTermChange={setSearch}
                serverPagination={{
                  page: data?.pagination.products.page ?? 1,
                  pageSize: PRODUCT_PAGE_LIMIT,
                  totalPages: data?.pagination.products.totalPages ?? 1,
                  totalItems: data?.pagination.products.totalItems ?? 0,
                  onPageChange: setPage,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
