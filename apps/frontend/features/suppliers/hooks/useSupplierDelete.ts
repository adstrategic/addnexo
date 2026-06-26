"use client";

import { useState } from "react";
import { useSupplierActions } from "./useSupplierActions";
import type { SupplierResponse } from "../schemas/SupplierSchemas";

interface UseSupplierDeleteOptions {
  onAfterDelete?: () => void;
}

export function useSupplierDelete(options?: UseSupplierDeleteOptions) {
  const actions = useSupplierActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (supplier: SupplierResponse) => {
    setSupplierToDelete({
      id: supplier.MPId,
      sequence: supplier.MPOrgSecuencia,
      description: supplier.MPDescripcion,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSupplierToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!supplierToDelete) return;
    actions.handleDelete(supplierToDelete.id, supplierToDelete.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    supplierToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}

