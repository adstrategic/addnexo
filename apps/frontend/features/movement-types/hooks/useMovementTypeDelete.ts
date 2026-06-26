"use client";

import { useState } from "react";
import { useMovementTypeActions } from "./useMovementTypeActions";

interface UseMovementTypeDeleteOptions {
  onAfterDelete?: () => void;
}

export function useMovementTypeDelete(options?: UseMovementTypeDeleteOptions) {
  const actions = useMovementTypeActions();

  // Estado para modal de eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [movementTypeAEliminar, setMovementTypeAEliminar] = useState<{
    id: number;
    sequence: number;
    descripcion: string;
  } | null>(null);

  const openDeleteModal = (
    id: number,
    descripcion: string,
    sequence: number,
  ) => {
    setMovementTypeAEliminar({ id, sequence, descripcion });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setMovementTypeAEliminar(null);
  };

  const handleDeleteConfirm = async () => {
    if (!movementTypeAEliminar) return;
    try {
      await actions.handleDelete(
        movementTypeAEliminar.id,
        movementTypeAEliminar.sequence,
      );
      closeDeleteModal();
      options?.onAfterDelete?.();
    } catch (error) {
      // El error ya es manejado por el toast en actions
      console.error(error);
    }
  };

  return {
    isDeleteModalOpen,
    movementTypeAEliminar,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
