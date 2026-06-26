import { useMutation, useQueryClient } from "@tanstack/react-query";

import { invoiceKeys } from "../../services/invoices.api";
import { movCxcApi } from "../services/mov-cxc.service";
import type {
  PaymentSubmitData,
  DebitNoteSubmitData,
  CreditNoteSubmitData,
  CreditNoteWithReturnSubmitData,
} from "../schemas/mov-cxc-schema";

// Low-level CXC mutation hooks. They only handle cache invalidation; the
// `*Manager` hooks own user-facing success/error toasts and form field errors.

function useInvalidateInvoice() {
  const queryClient = useQueryClient();
  return (orgSecuencia: number) => {
    queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    queryClient.invalidateQueries({
      queryKey: invoiceKeys.detail(orgSecuencia),
    });
  };
}

// Hook for registering a payment
export function useRegistrarPago() {
  const invalidate = useInvalidateInvoice();
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: PaymentSubmitData;
    }) => movCxcApi.registrarPago(invoiceId, data),
    onSuccess: (updatedInvoice) => invalidate(updatedInvoice.FGOrgSecuencia),
  });
}

// Hook for registering a debit note
export function useRegistrarNotaDebito() {
  const invalidate = useInvalidateInvoice();
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: DebitNoteSubmitData;
    }) => movCxcApi.registrarNotaDebito(invoiceId, data),
    onSuccess: (updatedInvoice) => invalidate(updatedInvoice.FGOrgSecuencia),
  });
}

// Hook for registering a simple credit note
export function useRegistrarNotaCredito() {
  const invalidate = useInvalidateInvoice();
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: CreditNoteSubmitData;
    }) => movCxcApi.registrarNotaCredito(invoiceId, data),
    onSuccess: (updatedInvoice) => invalidate(updatedInvoice.FGOrgSecuencia),
  });
}

// Hook for registering credit note with return
export function useRegistrarNotaCreditoConDevolucion() {
  const invalidate = useInvalidateInvoice();
  return useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: number;
      data: CreditNoteWithReturnSubmitData;
    }) => movCxcApi.registrarNotaCreditoConDevolucion(invoiceId, data),
    onSuccess: (updatedInvoice) => invalidate(updatedInvoice.FGOrgSecuencia),
  });
}
