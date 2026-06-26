"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

export const DISPATCH_ORDER_TABS = [
  "all",
  "unissued",
  "issued",
  "dispatched",
] as const;

export type DispatchOrderTab = (typeof DISPATCH_ORDER_TABS)[number];

export function isDispatchOrderTab(value: string): value is DispatchOrderTab {
  return DISPATCH_ORDER_TABS.includes(value as DispatchOrderTab);
}

/**
 * URL-synced list params for the dispatch orders module.
 * Pattern aligned with suppliers list pages.
 */
export function useDispatchOrderListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const searchTerm = searchParams.get("search") ?? "";
  const tabParam = searchParams.get("tab") ?? "all";
  const selectedTab: DispatchOrderTab = isDispatchOrderTab(tabParam)
    ? tabParam
    : "all";

  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
      const nextTab = isDispatchOrderTab(value) ? value : "all";
      replaceParams((params) => {
        if (nextTab === "all") params.delete("tab");
        else params.set("tab", nextTab);
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const clearFilters = useCallback(() => {
    replaceParams((params) => {
      params.delete("search");
      params.set("page", "1");
    });
  }, [replaceParams]);

  const hasActiveFilters = Boolean(searchTerm);

  return {
    currentPage,
    setPage,
    searchTerm,
    debouncedSearch: debouncedSearch || undefined,
    setSearch,
    selectedTab,
    setTab,
    clearFilters,
    hasActiveFilters,
  };
}
