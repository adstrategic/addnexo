"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { clientsService } from "@/features/clients/services/ClientsServices";
import { clientKeys } from "@/features/clients/hooks/useClients";
import type { ClienteResponse } from "@/features/clients/schemas/ClientSchema";

function useCustomerById(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...clientKeys.all, "filterById", id] as const,
    queryFn: async () => {
      const response = await clientsService.list({ limit: 100, page: 1 });
      return response.data.find((client) => client.CId === id) ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerFilterSelector(value?: number) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [openCustomers, setOpenCustomers] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedCustomer, setSelectedCustomer] =
    useState<ClienteResponse | null>(null);

  const debouncedQuery = useDebouncedValue(customerQuery, 300);

  const shouldFetch =
    openCustomers && (!hasUserInteracted || debouncedQuery === customerQuery);

  const {
    data: customersData,
    isFetching: loadingCustomers,
    isFetched,
  } = useQuery({
    queryKey: clientKeys.list({
      search: shouldFetch ? debouncedQuery || undefined : undefined,
      limit: 50,
    }),
    queryFn: () =>
      clientsService.list({
        search: debouncedQuery || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000,
  });

  const { data: resolvedCustomer } = useCustomerById(
    value,
    value != null && selectedCustomer?.CId !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedCustomer(null);
      return;
    }

    if (resolvedCustomer) {
      setSelectedCustomer(resolvedCustomer);
    }
  }, [value, resolvedCustomer]);

  const handleCustomerSearch = useCallback((query: string) => {
    setCustomerQuery(query);
    setHasUserInteracted(true);
  }, []);

  const toggleCustomerPopover = useCallback(
    (open: boolean) => {
      setOpenCustomers(open);
      if (!open) {
        setCustomerQuery(selectedCustomer?.CRazonSocial ?? "");
        setHasUserInteracted(false);
      }
    },
    [selectedCustomer],
  );

  const handleCustomerSelect = useCallback((customer: ClienteResponse | null) => {
    setSelectedCustomer(customer);
    setOpenCustomers(false);
    setCustomerQuery(customer?.CRazonSocial ?? "");
    setHasUserInteracted(false);
  }, []);

  return {
    customerQuery,
    openCustomers,
    customers: customersData?.data ?? [],
    loadingCustomers,
    isFetched,
    selectedCustomer,
    handleCustomerSearch,
    handleCustomerSelect,
    toggleCustomerPopover,
  };
}
