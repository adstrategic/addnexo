"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;
const DATE_FROM = "dateFrom";
const DATE_TO = "dateTo";

export const INVOICE_TABS = [
  "all",
  "active",
  "paid",
  "overdue",
  "anulated",
] as const;

export type InvoiceTab = (typeof INVOICE_TABS)[number];

function isInvoiceTab(value: string): value is InvoiceTab {
  return INVOICE_TABS.includes(value as InvoiceTab);
}

function parseDateParam(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * URL-synced list params for the invoices module.
 * Pattern aligned with dispatch orders and suppliers list pages.
 */
export function useInvoiceListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const searchTerm = searchParams.get("search") ?? "";
  const tabParam = searchParams.get("tab") ?? "all";
  const selectedTab: InvoiceTab = isInvoiceTab(tabParam) ? tabParam : "all";
  const dateFromStr = searchParams.get(DATE_FROM) ?? undefined;
  const dateToStr = searchParams.get(DATE_TO) ?? undefined;

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const dateRange = useMemo(() => {
    const from = parseDateParam(dateFromStr ?? null);
    const to = parseDateParam(dateToStr ?? null);
    if (!from && !to) return undefined;
    return { from, to };
  }, [dateFromStr, dateToStr]);

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const setPage = useCallback(
    (page: number) => {
      replaceParams((params) => {
        params.set("page", String(Math.max(1, page)));
      });
    },
    [replaceParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      replaceParams((params) => {
        if (value) params.set("search", value);
        else params.delete("search");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const setTab = useCallback(
    (value: string) => {
      const nextTab = isInvoiceTab(value) ? value : "all";
      replaceParams((params) => {
        if (nextTab === "all") params.delete("tab");
        else params.set("tab", nextTab);
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const setDateRange = useCallback(
    (from: Date | undefined, to: Date | undefined) => {
      replaceParams((params) => {
        if (from) params.set(DATE_FROM, toLocalDateString(from));
        else params.delete(DATE_FROM);
        if (to) params.set(DATE_TO, toLocalDateString(to));
        else params.delete(DATE_TO);
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const clearFilters = useCallback(() => {
    replaceParams((params) => {
      params.delete("search");
      params.delete(DATE_FROM);
      params.delete(DATE_TO);
      params.set("page", "1");
    });
  }, [replaceParams]);

  const hasActiveFilters = Boolean(
    searchTerm || dateFromStr || dateToStr,
  );

  return {
    currentPage,
    setPage,
    searchTerm,
    debouncedSearch: debouncedSearch || undefined,
    setSearch,
    selectedTab,
    setTab,
    dateRange,
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    setDateRange,
    clearFilters,
    hasActiveFilters,
  };
}
