import type { UseFormSetError } from "react-hook-form";
import { useCreateGroup, useUpdateGroup, useDeleteGroup } from "./useGroups";
import type { CreateGroupDto, UpdateGroupDto } from "../schemas/groups.schema";

export interface GroupMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over group mutations: consistent handler APIs and aggregated loading state.
 */
export function useGroupActions(setError?: UseFormSetError<CreateGroupDto>) {
  const createMutation = useCreateGroup(setError);
  const updateMutation = useUpdateGroup(setError);
  const deleteMutation = useDeleteGroup();

  const handleCreate = (
    data: CreateGroupDto,
    callbacks?: GroupMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateGroupDto,
    callbacks?: GroupMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    _sequence: number,
    callbacks?: GroupMutationCallbacks,
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
