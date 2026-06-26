import type { UseFormSetError } from "react-hook-form";
import {
  useCreateMovementType,
  useUpdateMovementType,
  useDeleteMovementType,
} from "./useMovementTypes";
import {
  type MovementTypeFormData,
  type ActualizarMovementTypeData,
} from "../schemas/movement-type-schema";

/**
 * Custom hook that encapsulates all movement type business logic and side effects:
 * - Create/Update/Delete operations
 * - Toast notifications
 * - Success/Error handling
 *
 * This hook follows the Single Responsibility Principle by handling ONLY
 * business logic and side effects, not UI state.
 *
 * @example
 * ```tsx
 * const movementTypeActions = useMovementTypeActions();
 *
 * // Create a movement type
 * await movementTypeActions.handleCreate(formData);
 *
 * // Update a movement type
 * await movementTypeActions.handleUpdate(movementTypeId, updatedData);
 *
 * // Delete a movement type
 * await movementTypeActions.handleDelete(movementTypeId, sequence);
 * ```
 */
export interface MovementTypeMutationCallbacks {
  onSuccess?: () => void;
}

export function useMovementTypeActions(
  setError?: UseFormSetError<MovementTypeFormData>,
) {
  const createMutation = useCreateMovementType(setError);
  const updateMutation = useUpdateMovementType(setError);
  const deleteMutation = useDeleteMovementType();

  const handleCreate = (
    data: MovementTypeFormData,
    callbacks?: MovementTypeMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: ActualizarMovementTypeData,
    callbacks?: MovementTypeMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: MovementTypeMutationCallbacks,
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
