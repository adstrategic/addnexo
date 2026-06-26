"use client";

import { useState } from "react";
import { useAlmacenActions } from "./useAlmacenActions";
import type { AlmacenResponse } from "../schemas/almacenes.schema";

interface UseAlmacenDeleteOptions {
  onAfterDelete?: () => void;
}

export function useAlmacenDelete(options?: UseAlmacenDeleteOptions) {
  const actions = useAlmacenActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [almacenToDelete, setAlmacenToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (almacen: AlmacenResponse) => {
    setAlmacenToDelete({
      id: almacen.ALId,
      sequence: almacen.ALOrgSecuencia,
      description: almacen.ALNombre,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAlmacenToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!almacenToDelete) return;
    actions.handleDelete(almacenToDelete.id, almacenToDelete.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    almacenToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
