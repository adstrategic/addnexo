"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const DATE_FROM = "dateFrom";
const DATE_TO = "dateTo";

/** Parse YYYY-MM-DD as local calendar date (no UTC shift). */
function parseDateParam(value: string | null): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (y === undefined || m === undefined || d === undefined) return undefined;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Format date as YYYY-MM-DD from local date parts (no UTC conversion). */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Hook for managing invoices date range URL params (dateFrom, dateTo).
 * Exposes parsed dateRange and setters that update the URL and reset page to 1.
 */
export function useInvoicesDateRangeParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const dateFromStr = searchParams.get(DATE_FROM) ?? undefined;
  const dateToStr = searchParams.get(DATE_TO) ?? undefined;

  const dateRange = useMemo(() => {
    const from = parseDateParam(dateFromStr ?? null);
    const to = parseDateParam(dateToStr ?? null);
    if (!from && !to) return undefined;
    return { from, to };
  }, [dateFromStr, dateToStr]);

  const setDateRange = (
    from: Date | undefined,
    to: Date | undefined,
    resetPagination: boolean = true,
  ) => {
    const params = new URLSearchParams(searchParams);
    if (from) {
      params.set(DATE_FROM, toLocalDateString(from));
    } else {
      params.delete(DATE_FROM);
    }
    if (to) {
      params.set(DATE_TO, toLocalDateString(to));
    } else {
      params.delete(DATE_TO);
    }
    if (resetPagination) {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearDateRange = (resetPagination: boolean = true) => {
    setDateRange(undefined, undefined, resetPagination);
  };

  return {
    dateRange,
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    setDateRange,
    clearDateRange,
  };
}
