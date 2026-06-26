"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

function parseOptionalId(param: string | null): number | undefined {
  if (!param) return undefined;
  const parsed = Number(param);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * URL-synced list params for the catalog module.
 * Pattern aligned with suppliers list pages.
 */
export function useCatalogListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const searchTerm = searchParams.get("search") ?? "";
  const originId = parseOptionalId(searchParams.get("originId"));
  const unitId = parseOptionalId(searchParams.get("unitId"));
  const grupoId = parseOptionalId(searchParams.get("grupoId"));

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

  const setOriginId = useCallback(
    (value: number | undefined) => {
      replaceParams((params) => {
        if (value) params.set("originId", String(value));
        else params.delete("originId");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const setUnitId = useCallback(
    (value: number | undefined) => {
      replaceParams((params) => {
        if (value) params.set("unitId", String(value));
        else params.delete("unitId");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const setGrupoId = useCallback(
    (value: number | undefined) => {
      replaceParams((params) => {
        if (value) params.set("grupoId", String(value));
        else params.delete("grupoId");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const clearFilters = useCallback(() => {
    replaceParams((params) => {
      params.delete("search");
      params.delete("originId");
      params.delete("unitId");
      params.delete("grupoId");
      params.set("page", "1");
    });
  }, [replaceParams]);

  const hasActiveFilters = Boolean(
    searchTerm || originId || unitId || grupoId,
  );

  return {
    currentPage,
    setPage,
    searchTerm,
    debouncedSearch: debouncedSearch || undefined,
    setSearch,
    originId,
    setOriginId,
    unitId,
    setUnitId,
    grupoId,
    setGrupoId,
    clearFilters,
    hasActiveFilters,
  };
}
