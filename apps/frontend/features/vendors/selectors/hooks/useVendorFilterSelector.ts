"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { vendorKeys } from "../../hooks/useVendors";
import { vendorsService } from "../../services/VendorServices";
import type { VendorResponse } from "../../schemas/VendorSchema";

function useVendorById(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...vendorKeys.all, "filterById", id] as const,
    queryFn: async () => {
      const response = await vendorsService.list({ limit: 100, page: 1 });
      return response.data.find((vendor) => vendor.VId === id) ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendorFilterSelector(value?: number) {
  const [vendorQuery, setVendorQuery] = useState("");
  const [openVendors, setOpenVendors] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorResponse | null>(
    null,
  );

  const debouncedQuery = useDebouncedValue(vendorQuery, 300);

  const shouldFetch =
    openVendors && (!hasUserInteracted || debouncedQuery === vendorQuery);

  const {
    data: vendorsData,
    isFetching: loadingVendors,
    isFetched,
  } = useQuery({
    queryKey: vendorKeys.list({
      search: shouldFetch ? debouncedQuery || undefined : undefined,
      limit: 50,
    }),
    queryFn: () =>
      vendorsService.list({
        search: debouncedQuery || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000,
  });

  const { data: resolvedVendor } = useVendorById(
    value,
    value != null && selectedVendor?.VId !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedVendor(null);
      return;
    }

    if (resolvedVendor) {
      setSelectedVendor(resolvedVendor);
    }
  }, [value, resolvedVendor]);

  const handleVendorSearch = useCallback((query: string) => {
    setVendorQuery(query);
    setHasUserInteracted(true);
  }, []);

  const toggleVendorPopover = useCallback(
    (open: boolean) => {
      setOpenVendors(open);
      if (!open) {
        setVendorQuery(selectedVendor?.VNombre ?? "");
        setHasUserInteracted(false);
      }
    },
    [selectedVendor],
  );

  const handleVendorSelect = useCallback((vendor: VendorResponse | null) => {
    setSelectedVendor(vendor);
    setOpenVendors(false);
    setVendorQuery(vendor?.VNombre ?? "");
    setHasUserInteracted(false);
  }, []);

  return {
    vendorQuery,
    openVendors,
    vendors: vendorsData?.data ?? [],
    loadingVendors,
    isFetched,
    selectedVendor,
    handleVendorSearch,
    handleVendorSelect,
    toggleVendorPopover,
  };
}
