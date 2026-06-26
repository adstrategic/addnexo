"use client";

import { useState } from "react";
import { useBankActions } from "./useBankActions";

interface UseBankDeleteOptions {
  onAfterDelete?: () => void;
}

export function useBankDelete(options?: UseBankDeleteOptions) {
  const actions = useBankActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bankAEliminar, setBankAEliminar] = useState<{
    secuencia: number;
    nombre: string;
  } | null>(null);

  const openDeleteModal = (secuencia: number, nombre: string) => {
    setBankAEliminar({ secuencia, nombre });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setBankAEliminar(null);
  };

  const handleDeleteConfirm = () => {
    if (!bankAEliminar) return;
    actions.handleDelete(bankAEliminar.secuencia, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    bankAEliminar,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
