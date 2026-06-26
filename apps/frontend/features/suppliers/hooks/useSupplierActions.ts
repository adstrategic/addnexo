import type { UseFormSetError } from "react-hook-form";
import {
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
} from "./useSuppliers";
import type {
  CreateSupplierDTO,
  UpdateSupplierDTO,
} from "../schemas/SupplierSchemas";

export interface SupplierMutationCallbacks {
  onSuccess?: () => void;
}

export function useSupplierActions(
  setError?: UseFormSetError<CreateSupplierDTO>,
) {
  const createMutation = useCreateSupplier(setError);
  const updateMutation = useUpdateSupplier(setError);
  const deleteMutation = useDeleteSupplier();

  const handleCreate = (
    data: CreateSupplierDTO,
    callbacks?: SupplierMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateSupplierDTO,
    callbacks?: SupplierMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: SupplierMutationCallbacks,
  ) => {
    deleteMutation.mutate(
      { id, sequence },
      {
        onSuccess: callbacks?.onSuccess,
      },
    );
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
