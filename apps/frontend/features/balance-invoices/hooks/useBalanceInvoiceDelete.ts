"use client";

import { useState } from "react";
import { useBalanceInvoiceActions } from "./useBalanceInvoicesActions";

interface UseBalanceInvoiceDeleteOptions {
  onAfterDelete?: () => void;
}

export function useBalanceInvoiceDelete(
  options?: UseBalanceInvoiceDeleteOptions,
) {
  const actions = useBalanceInvoiceActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facturaAEliminar, setFacturaAEliminar] = useState<{
    sequence: number;
    number: number;
  } | null>(null);

  const openDeleteModal = (sequence: number, number: number) => {
    setFacturaAEliminar({ sequence, number });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setFacturaAEliminar(null);
  };

  const handleDeleteConfirm = () => {
    if (!facturaAEliminar) return;
    actions.handleDelete(facturaAEliminar.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    facturaAEliminar,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
