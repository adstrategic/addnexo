import type { UseFormSetError } from "react-hook-form";
import { useCreateUnit, useUpdateUnit, useDeleteUnit } from "./useUnits";
import type { CreateUnitDto, UpdateUnitDto } from "../schemas/units.schema";

export interface UnitMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over unit mutations: consistent handler APIs and aggregated loading state.
 */
export function useUnitActions(setError?: UseFormSetError<CreateUnitDto>) {
  const createMutation = useCreateUnit(setError);
  const updateMutation = useUpdateUnit(setError);
  const deleteMutation = useDeleteUnit();

  const handleCreate = (
    data: CreateUnitDto,
    callbacks?: UnitMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateUnitDto,
    callbacks?: UnitMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    _sequence: number,
    callbacks?: UnitMutationCallbacks,
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
