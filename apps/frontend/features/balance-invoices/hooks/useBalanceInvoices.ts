import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { facturaApi } from "../service/BalanceInvoicesService";
import type {
  CreateBalanceInvoiceHeaderData,
  UpdateBalanceInvoiceData,
} from "../schemas/BalanceInvoicesSchema";
import type { EstadoFacturaValue } from "../schemas/BalanceInvoicesResponseSchema";

const _all = ["saldos-facturas"] as const;

export const balanceInvoiceKeys = {
  all: _all,
  lists: () => [..._all, "list"] as const,
  list: (params?: {
    page?: number;
    estado?: EstadoFacturaValue;
    clienteId?: number;
    search?: string;
  }) => [..._all, "list", params] as const,
  details: () => [..._all, "detail"] as const,
  detail: (secuencia: number) => [..._all, "detail", secuencia] as const,
  siguienteNumero: [..._all, "siguienteNumero"] as const,
};

export function useBalanceInvoices(params?: {
  page?: number;
  estado?: EstadoFacturaValue;
  clienteId?: number;
  vendedorId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params || {};

  return useQuery({
    queryKey: balanceInvoiceKeys.list(queryParams),
    queryFn: () => facturaApi.obtenerFacturas(queryParams),
    enabled,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useBalanceInvoice(secuencia: number, enabled: boolean = true) {
  return useQuery({
    queryKey: balanceInvoiceKeys.detail(secuencia),
    queryFn: () => facturaApi.obtenerFactura(secuencia),
    enabled: enabled && !!secuencia,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useNextFacturaNumber() {
  return useQuery({
    queryKey: balanceInvoiceKeys.siguienteNumero,
    queryFn: () => facturaApi.obtenerSiguienteNumero(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateBalanceInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sequence,
      data,
    }: {
      sequence: number;
      data: UpdateBalanceInvoiceData;
    }) => facturaApi.actualizarFactura(sequence, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: balanceInvoiceKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: balanceInvoiceKeys.detail(variables.sequence),
      });
    },
  });
}

export function useDeleteBalanceInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => facturaApi.eliminarFactura(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: balanceInvoiceKeys.lists() });
    },
  });
}

export function useCreateBalanceInvoiceHeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBalanceInvoiceHeaderData) =>
      facturaApi.crearFacturaHeader(data),
    onSuccess: (factura) => {
      queryClient.invalidateQueries({ queryKey: balanceInvoiceKeys.lists() });
      queryClient.setQueryData(
        balanceInvoiceKeys.detail(factura.FGOrgSecuencia),
        factura,
      );
    },
  });
}

export function useAddBalanceInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      facturaId,
      itemData,
    }: {
      facturaId: number;
      itemData: { FUInvcaruniId: number; FUVrUnitario: number };
    }) => facturaApi.agregarFacturaItem(facturaId, itemData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceInvoiceKeys.detail(variables.facturaId),
      });
    },
  });
}

export function useUpdateBalanceInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      facturaId,
      itemId,
      updateData,
    }: {
      facturaId: number;
      itemId: number;
      updateData: { FUVrUnitario?: number };
    }) => facturaApi.actualizarFacturaItem(facturaId, itemId, updateData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceInvoiceKeys.detail(variables.facturaId),
      });
    },
  });
}

export function useDeleteBalanceInvoiceItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      facturaId,
      itemId,
    }: {
      facturaId: number;
      itemId: number;
    }) => facturaApi.eliminarFacturaItem(facturaId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: balanceInvoiceKeys.detail(variables.facturaId),
      });
    },
  });
}
