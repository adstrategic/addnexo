"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { suppliersService } from "@/features/suppliers/services/SupplierServices";
import { supplierKeys } from "@/features/suppliers/hooks/useSuppliers";
import type { SupplierResponse } from "@/features/suppliers";

function useSupplierById(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...supplierKeys.all, "filterById", id] as const,
    queryFn: async () => {
      const response = await suppliersService.list({ limit: 100, page: 1 });
      return response.data.find((supplier) => supplier.MPId === id) ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSupplierFilterSelector(value?: number) {
  const [supplierQuery, setSupplierQuery] = useState("");
  const [openSuppliers, setOpenSuppliers] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierResponse | null>(null);

  const debouncedQuery = useDebouncedValue(supplierQuery, 300);

  const shouldFetch =
    openSuppliers && (!hasUserInteracted || debouncedQuery === supplierQuery);

  const {
    data: suppliersData,
    isFetching: loadingSuppliers,
    isFetched,
  } = useQuery({
    queryKey: supplierKeys.list({
      search: shouldFetch ? debouncedQuery || undefined : undefined,
      limit: 50,
    }),
    queryFn: () =>
      suppliersService.list({
        search: debouncedQuery || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000,
  });

  const { data: resolvedSupplier } = useSupplierById(
    value,
    value != null && selectedSupplier?.MPId !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedSupplier(null);
      return;
    }

    if (resolvedSupplier) {
      setSelectedSupplier(resolvedSupplier);
    }
  }, [value, resolvedSupplier]);

  const handleSupplierSearch = useCallback((query: string) => {
    setSupplierQuery(query);
    setHasUserInteracted(true);
  }, []);

  const toggleSupplierPopover = useCallback(
    (open: boolean) => {
      setOpenSuppliers(open);
      if (!open) {
        setSupplierQuery(selectedSupplier?.MPDescripcion ?? "");
        setHasUserInteracted(false);
      }
    },
    [selectedSupplier],
  );

  const handleSupplierSelect = useCallback((supplier: SupplierResponse | null) => {
    setSelectedSupplier(supplier);
    setOpenSuppliers(false);
    setSupplierQuery(supplier?.MPDescripcion ?? "");
    setHasUserInteracted(false);
  }, []);

  return {
    supplierQuery,
    openSuppliers,
    suppliers: suppliersData?.data ?? [],
    loadingSuppliers,
    isFetched,
    selectedSupplier,
    handleSupplierSearch,
    handleSupplierSelect,
    toggleSupplierPopover,
  };
}
