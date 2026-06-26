import type { UseFormSetError } from "react-hook-form";
import { useCreateClient, useUpdateClient, useDeleteClient } from "./useClients";
import type {
  CreateClientDto,
  UpdateClientDto,
} from "../schemas/ClientSchema";

/**
 * Custom hook that encapsulates all client business logic and side effects:
 * - Create/Update/Delete operations
 * - Toast notifications
 * - Success/Error handling
 *
 * This hook follows the Single Responsibility Principle by handling ONLY
 * business logic and side effects, not UI state.
 *
 * @example
 * ```tsx
 * const clientActions = useClientActions();
 *
 * // Create a client
 * await clientActions.handleCreate(formData);
 *
 * // Update a client
 * await clientActions.handleUpdate(clientId, updatedData);
 *
 * // Delete a client
 * await clientActions.handleDelete(clientId, sequence);
 * ```
 */
export interface ClientMutationCallbacks {
  onSuccess?: () => void;
}

export function useClientActions(
  setError?: UseFormSetError<CreateClientDto>,
) {
  const createMutation = useCreateClient(setError);
  const updateMutation = useUpdateClient(setError);
  const deleteMutation = useDeleteClient();

  const handleCreate = (
    data: CreateClientDto,
    callbacks?: ClientMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateClientDto,
    callbacks?: ClientMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    id: number,
    sequence: number,
    callbacks?: ClientMutationCallbacks,
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

