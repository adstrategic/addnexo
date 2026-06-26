"use client";

import type { UseFormSetError } from "react-hook-form";
import {
  useCrearProducto,
  useActualizarProducto,
  useEliminarProducto,
} from "./useCatalog";
import type {
  ActualizarProductoData,
  ProductFormData,
} from "../schemas/CatalogSchema";

export interface ProductMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over product mutations: consistent handler APIs and aggregated loading state.
 */
export function useProductActions(setError?: UseFormSetError<ProductFormData>) {
  const createMutation = useCrearProducto(setError);
  const updateMutation = useActualizarProducto(setError);
  const deleteMutation = useEliminarProducto();

  const handleCreate = (
    data: ProductFormData,
    callbacks?: ProductMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: ActualizarProductoData,
    callbacks?: ProductMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (id: number, callbacks?: ProductMutationCallbacks) => {
    deleteMutation.mutate(id, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating: createMutation.isPending || updateMutation.isPending,
  };
}
