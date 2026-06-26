import type { UseFormSetError } from "react-hook-form";
import {
  useCreateAlmacen,
  useUpdateAlmacen,
  useDeleteAlmacen,
} from "./useAlmacenes";
import type {
  CreateAlmacenDto,
  UpdateAlmacenDto,
} from "../schemas/almacenes.schema";

export interface AlmacenMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over almacen mutations: consistent handler APIs and aggregated loading state.
 */
export function useAlmacenActions(
  setError?: UseFormSetError<CreateAlmacenDto>,
) {
  const createMutation = useCreateAlmacen(setError);
  const updateMutation = useUpdateAlmacen(setError);
  const deleteMutation = useDeleteAlmacen();

  const handleCreate = (
    data: CreateAlmacenDto,
    callbacks?: AlmacenMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateAlmacenDto,
    callbacks?: AlmacenMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    _sequence: number,
    callbacks?: AlmacenMutationCallbacks,
  ) => {
    deleteMutation.mutate(
      { id, sequence: _sequence },
      { onSuccess: callbacks?.onSuccess },
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
