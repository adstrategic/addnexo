"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 300;

/**
 * URL-synced list params for the movements module.
 * Pattern aligned with suppliers and movement-types list pages.
 */
export function useMovementListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") ?? 1) || 1;
  const searchTerm = searchParams.get("search") ?? "";

  const productIdParam = searchParams.get("productId");
  const supplierIdParam = searchParams.get("supplierId");
  const customerIdParam = searchParams.get("customerId");

  const productId = productIdParam ? Number(productIdParam) : undefined;
  const supplierId = supplierIdParam ? Number(supplierIdParam) : undefined;
  const customerId = customerIdParam ? Number(customerIdParam) : undefined;

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

  const setProductId = useCallback(
    (value: number | undefined) => {
      replaceParams((params) => {
        if (value) params.set("productId", String(value));
        else params.delete("productId");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const setSupplierId = useCallback(
    (value: number | undefined) => {
      replaceParams((params) => {
        if (value) params.set("supplierId", String(value));
        else params.delete("supplierId");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const setCustomerId = useCallback(
    (value: number | undefined) => {
      replaceParams((params) => {
        if (value) params.set("customerId", String(value));
        else params.delete("customerId");
        params.set("page", "1");
      });
    },
    [replaceParams],
  );

  const clearFilters = useCallback(() => {
    replaceParams((params) => {
      params.delete("search");
      params.delete("productId");
      params.delete("supplierId");
      params.delete("customerId");
      params.set("page", "1");
    });
  }, [replaceParams]);

  const hasActiveFilters = Boolean(
    searchTerm || productId || supplierId || customerId,
  );

  const parseId = (id: number | undefined) =>
    id != null && !Number.isNaN(id) ? id : undefined;

  return {
    currentPage,
    setPage,
    searchTerm,
    debouncedSearch: debouncedSearch || undefined,
    setSearch,
    productId: parseId(productId),
    setProductId,
    supplierId: parseId(supplierId),
    setSupplierId,
    customerId: parseId(customerId),
    setCustomerId,
    clearFilters,
    hasActiveFilters,
  };
}
