"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProductActions } from "./useCatalogActions";

interface UseProductDeleteOptions {
  onAfterDelete?: () => void;
  redirectOnDelete?: boolean;
}

export function useProductDelete(options?: UseProductDeleteOptions) {
  const router = useRouter();
  const actions = useProductActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState<{
    CKId: number;
    CKDescripcion: string;
  } | null>(null);

  const openDeleteModal = (CKId: number, CKDescripcion: string) => {
    setProductoAEliminar({ CKId, CKDescripcion });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductoAEliminar(null);
  };

  const handleDeleteConfirm = () => {
    if (!productoAEliminar) return;
    actions.handleDelete(productoAEliminar.CKId, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
        if (options?.redirectOnDelete) {
          router.push("/catalog");
        }
      },
    });
  };

  return {
    isDeleteModalOpen,
    productoAEliminar,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
