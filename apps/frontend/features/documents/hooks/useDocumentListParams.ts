"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { DocumentType } from "../schemas/documents-response.schema";

const DEBOUNCE_MS = 300;

export const DOCUMENT_TABS = [
  "dispatch-order",
  "purchase-order",
  "invoice",
] as const;

export type DocumentTab = (typeof DOCUMENT_TABS)[number];

export function isDocumentTab(value: string): value is DocumentTab {
  return DOCUMENT_TABS.includes(value as DocumentTab);
}

export function useDocumentListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const searchTerm = searchParams.get("search") ?? "";
  const tabParam = searchParams.get("tab") ?? "dispatch-order";
  const selectedTab: DocumentTab = isDocumentTab(tabParam)
    ? tabParam
    : "dispatch-order";

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
      const nextTab = isDocumentTab(value) ? value : "dispatch-order";
      replaceParams((params) => {
        if (nextTab === "dispatch-order") params.delete("tab");
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
    selectedTab: selectedTab as DocumentType,
    setTab,
    clearFilters,
    hasActiveFilters,
  };
}
