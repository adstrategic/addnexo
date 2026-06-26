"use client";

import { useState } from "react";
import { useVendorActions } from "./useVendorActions";

interface UseVendorDeleteOptions {
  onAfterDelete?: () => void;
}

export function useVendorDelete(options?: UseVendorDeleteOptions) {
  const actions = useVendorActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<{
    id: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (id: number, description: string) => {
    setVendorToDelete({ id, description });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setVendorToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!vendorToDelete) return;
    actions.handleDelete(vendorToDelete.id, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    vendorToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
