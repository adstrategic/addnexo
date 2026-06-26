"use client";

import { useState } from "react";
import { useDispatchOrderActions } from "./useDispatchOrderActions";

interface UseDispatchOrderDeleteOptions {
  onAfterDelete?: () => void;
}

export function useDispatchOrderDelete(
  options?: UseDispatchOrderDeleteOptions,
) {
  const actions = useDispatchOrderActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dispatchOrderAEliminar, setDispatchOrderAEliminar] = useState<{
    sequence: number;
    number: number;
  } | null>(null);

  const openDeleteModal = (sequence: number, number: number) => {
    setDispatchOrderAEliminar({ sequence, number });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDispatchOrderAEliminar(null);
  };

  const handleDeleteConfirm = () => {
    if (!dispatchOrderAEliminar) return;
    actions.handleDelete(dispatchOrderAEliminar.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    dispatchOrderAEliminar,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
