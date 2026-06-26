import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";
import { invoiceKeys } from "@/features/invoices/services/invoices.api";
import { dispatchOrdersService } from "../service/dispatch-orders.service";
import type { ListDispatchOrdersParams } from "../schemas/dispatch-order-response.schema";
import type {
  CreateDispatchOrderHeaderData,
  UpdateDispatchOrderData,
} from "../schemas/dispatch-order-schema";
import type { ConvertDispatchOrderToInvoiceData } from "../schemas/dispatch-order-to-invoice.schema";

type ListParams = ListDispatchOrdersParams & {
  enabled?: boolean;
};

export const dispatchOrderKeys = {
  all: ["dispatch-orders"] as const,
  lists: () => [...dispatchOrderKeys.all, "list"] as const,
  list: (params?: ListDispatchOrdersParams) =>
    [...dispatchOrderKeys.lists(), params] as const,
  details: () => [...dispatchOrderKeys.all, "detail"] as const,
  detail: (secuencia: number) =>
    [...dispatchOrderKeys.details(), secuencia] as const,
  documents: (secuencia: number) =>
    [...dispatchOrderKeys.detail(secuencia), "documents"] as const,
};

export function useDispatchOrders(params?: ListParams) {
  const { enabled = true, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: dispatchOrderKeys.list(queryParams),
    queryFn: () => dispatchOrdersService.list(queryParams),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useDispatchOrder(secuencia: number, enabled = true) {
  return useQuery({
    queryKey: dispatchOrderKeys.detail(secuencia),
    queryFn: () => dispatchOrdersService.getBySequence(secuencia),
    enabled: enabled && !!secuencia,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useUpdateDispatchOrder(
  setError?: UseFormSetError<CreateDispatchOrderHeaderData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      secuencia,
      data,
    }: {
      secuencia: number;
      data: UpdateDispatchOrderData;
    }) => dispatchOrdersService.update(secuencia, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
      toast.success("Dispatch order updated");
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useEmitDispatchOrder(
  setError?: UseFormSetError<CreateDispatchOrderHeaderData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      secuencia,
      data,
    }: {
      secuencia: number;
      data: UpdateDispatchOrderData;
    }) => dispatchOrdersService.emit(secuencia, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
      toast.success("Dispatch order issued");
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useDeleteDispatchOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (secuencia: number) => dispatchOrdersService.remove(secuencia),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      toast.success("Dispatch order deleted");
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useCreateDispatchOrderHeader(
  setError?: UseFormSetError<CreateDispatchOrderHeaderData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDispatchOrderHeaderData) =>
      dispatchOrdersService.createHeader(data),
    onSuccess: (dispatchOrder) => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      queryClient.setQueryData(
        dispatchOrderKeys.detail(dispatchOrder.DOGOrgSecuencia),
        dispatchOrder,
      );
      toast.success("Dispatch order created");
    },
    onError: (err) => handleMutationError(err, setError),
  });
}

export function useAddDispatchOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      secuencia,
      itemData,
    }: {
      orderId: number;
      secuencia: number;
      itemData: Parameters<typeof dispatchOrdersService.addItem>[1];
    }) => dispatchOrdersService.addItem(orderId, itemData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useUpdateDispatchOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      secuencia,
      updateData,
    }: {
      orderId: number;
      itemId: number;
      secuencia: number;
      updateData: Parameters<typeof dispatchOrdersService.updateItem>[2];
    }) => dispatchOrdersService.updateItem(orderId, itemId, updateData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useDeleteDispatchOrderItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      itemId,
      secuencia,
    }: {
      orderId: number;
      itemId: number;
      secuencia: number;
    }) => dispatchOrdersService.removeItem(orderId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useRegenerateEmittedDispatchPdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (secuencia: number) =>
      dispatchOrdersService.regenerarPdfEmitido(secuencia),
    onSuccess: (_, secuencia) => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(secuencia),
      });
      toast.success("PDF regenerated");
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useDownloadDispatchPdf() {
  return useMutation({
    mutationFn: (secuencia: number) =>
      dispatchOrdersService.downloadPdf(secuencia),
    onError: (err) => handleMutationError(err),
  });
}

/**
 * Convert a dispatched order into an invoice (POST /invoices).
 * On success the dispatch order moves to INVOICED, so both the dispatch-order
 * and invoice caches are invalidated. The variables carry the order's
 * `secuencia` so its detail view refreshes to the new state.
 */
export function useConvertDispatchOrderToInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
    }: {
      secuencia: number;
      data: ConvertDispatchOrderToInvoiceData;
    }) => dispatchOrdersService.convertToInvoice(data),
    onSuccess: (_invoice, variables) => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
    onError: (err) => handleMutationError(err),
  });
}

export function useAnnulDispatchOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      secuencia,
      razonAnulacion,
    }: {
      secuencia: number;
      razonAnulacion?: string;
    }) => dispatchOrdersService.anular(secuencia, razonAnulacion),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(variables.secuencia),
      });
      toast.success("Dispatch order annulled");
    },
    onError: (err) => handleMutationError(err),
  });
}
