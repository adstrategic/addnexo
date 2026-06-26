// features/invoices/hooks/useInvoices.ts
import { useQuery } from "@tanstack/react-query";

import { invoiceApi, invoiceKeys } from "../services/invoices.api";
import type { ListInvoicesParams } from "../schemas/invoices-response.schema";

// Hook to get list of invoices
export function useInvoices(
  params?: ListInvoicesParams & { enabled?: boolean },
) {
  const { enabled = true, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: invoiceKeys.list(queryParams),
    queryFn: () => invoiceApi.obtenerInvoices(queryParams),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

// Hook to get a specific invoice
export function useInvoice(secuencia: number, enabled: boolean = true) {
  return useQuery({
    queryKey: invoiceKeys.detail(secuencia),
    queryFn: () => invoiceApi.obtenerInvoice(secuencia),
    enabled: enabled && !!secuencia,
    staleTime: 0,
    refetchOnMount: true,
  });
}
