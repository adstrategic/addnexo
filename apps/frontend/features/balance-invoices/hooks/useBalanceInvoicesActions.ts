"use client";

import { useRouter } from "next/navigation";
import {
  useCreateBalanceInvoiceHeader,
  useUpdateBalanceInvoice,
  useDeleteBalanceInvoice,
} from "./useBalanceInvoices";
import type {
  CreateBalanceInvoiceHeaderData,
  UpdateBalanceInvoiceData,
} from "../schemas/BalanceInvoicesSchema";
import type { Factura } from "../schemas/BalanceInvoicesResponseSchema";

export interface BalanceInvoiceMutationCallbacks {
  onSuccess?: (data: Factura) => void;
}

export interface BalanceInvoiceDeleteCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over balance-invoice mutations: consistent handler APIs and aggregated loading state.
 */
export function useBalanceInvoiceActions() {
  const router = useRouter();

  const createHeaderMutation = useCreateBalanceInvoiceHeader();
  const updateMutation = useUpdateBalanceInvoice();
  const deleteMutation = useDeleteBalanceInvoice();

  const handleCreate = (
    data: CreateBalanceInvoiceHeaderData,
    callbacks?: BalanceInvoiceMutationCallbacks,
  ) => {
    createHeaderMutation.mutate(data, {
      onSuccess: (factura) => {
        router.push(`/balance-invoices/${factura.FGOrgSecuencia}/edit`);
        callbacks?.onSuccess?.(factura);
      },
    });
  };

  const handleUpdate = (
    sequence: number,
    data: UpdateBalanceInvoiceData,
    callbacks?: BalanceInvoiceMutationCallbacks,
  ) => {
    updateMutation.mutate(
      { sequence, data },
      {
        onSuccess: (factura) => {
          router.push(`/balance-invoices/${sequence}`);
          callbacks?.onSuccess?.(factura);
        },
      },
    );
  };

  const handleDelete = (
    sequence: number,
    callbacks?: BalanceInvoiceDeleteCallbacks,
  ) => {
    deleteMutation.mutate(sequence, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    isCreating: createHeaderMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createHeaderMutation.isPending || updateMutation.isPending,
  };
}
