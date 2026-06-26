"use client";

import { useState } from "react";
import { useUnitActions } from "./useUnitActions";
import type { UnitResponse } from "../schemas/units.schema";

interface UseUnitDeleteOptions {
  onAfterDelete?: () => void;
}

export function useUnitDelete(options?: UseUnitDeleteOptions) {
  const actions = useUnitActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (unit: UnitResponse) => {
    setUnitToDelete({
      id: unit.UMId,
      sequence: unit.UMOrgSecuencia,
      description: unit.UMDescripcion || unit.UMNombre,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUnitToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!unitToDelete) return;
    actions.handleDelete(unitToDelete.id, unitToDelete.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    unitToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
