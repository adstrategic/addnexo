"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

import { useBillingDashboard } from "../hooks/useBillingDashboard";
import type {
  BillingFilterState,
  BillingInvoice,
} from "../schemas/BillingSchemas";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { BillingFiltersBar } from "./BillingFiltersBar";
import { BillingKpiStrip } from "./BillingKpiStrip";
import { BillingTable } from "./BillingTable";
import { InvoiceDetailSheet } from "./InvoiceDetailSheet";

const PAGE_SIZE = 10;

function parseDateParam(value: string): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const initialFilters: BillingFilterState = {
  search: "",
  status: "All",
  clientId: undefined,
  vendorId: undefined,
  dateFrom: "",
  dateTo: "",
};

export function BillingContent() {
  const [filters, setFilters] = useState<BillingFilterState>(initialFilters);
  const [page, setPage] = useState(1);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<BillingInvoice | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const dateRange = useMemo(() => {
    const from = parseDateParam(filters.dateFrom);
    const to = parseDateParam(filters.dateTo);
    if (!from && !to) return undefined;
    return { from, to };
  }, [filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filters.status,
    filters.clientId,
    filters.vendorId,
    filters.dateFrom,
    filters.dateTo,
  ]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status !== "All" ||
      filters.clientId != null ||
      filters.vendorId != null ||
      filters.dateFrom ||
      filters.dateTo,
  );

  const { data, isLoading, error } = useBillingDashboard({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status: filters.status,
    clientId: filters.clientId,
    vendorId: filters.vendorId,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  const handleFilterChange = <K extends keyof BillingFilterState>(
    key: K,
    value: BillingFilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleDateRangeChange = (
    from: Date | undefined,
    to: Date | undefined,
  ) => {
    setFilters((prev) => ({
      ...prev,
      dateFrom: from ? toLocalDateString(from) : "",
      dateTo: to ? toLocalDateString(to) : "",
    }));
  };

  if (error) {
    return <ErrorBoundary error={error} entityName="Billing dashboard" />;
  }

  const kpis = data?.kpis ?? {
    totalInvoices: 0,
    totalRevenue: 0,
    paidAmount: 0,
    outstandingAmount: 0,
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-10 md:p-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Billing Consultation</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive billing records and payment analytics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={showAnalytics ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAnalytics((prev) => !prev)}
            className={cn("gap-2", !showAnalytics && "text-primary")}
          >
            <BarChart2 size={16} /> Analytics
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={14} /> Export Report
          </Button>
        </div>
      </div>

      <BillingKpiStrip
        totalInvoices={kpis.totalInvoices}
        totalRevenue={kpis.totalRevenue}
        paidAmount={kpis.paidAmount}
        outstandingAmount={kpis.outstandingAmount}
      />

      {showAnalytics && (
        <AnalyticsPanel
          monthlyData={data?.monthlyData ?? []}
          statusStats={data?.statusStats ?? { paid: 0, pending: 0, overdue: 0 }}
          methodData={data?.methodData ?? []}
        />
      )}

      <div className="flex flex-1 flex-col">
        <h2 className="mb-3 text-[14px] font-semibold text-foreground">
          Billing Records
        </h2>
        <BillingFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
        {isLoading ? (
          <div className="rounded-b-xl border p-8 text-center text-sm text-muted-foreground">
            Loading billing data...
          </div>
        ) : (
          <BillingTable
            invoices={data?.rows ?? []}
            onViewInvoice={setActiveInvoice}
            page={data?.pagination.page ?? 1}
            pageSize={PAGE_SIZE}
            totalPages={data?.pagination.totalPages ?? 1}
            totalItems={data?.pagination.totalItems ?? 0}
            onPageChange={setPage}
          />
        )}
      </div>

      <InvoiceDetailSheet
        invoice={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />
    </div>
  );
}
