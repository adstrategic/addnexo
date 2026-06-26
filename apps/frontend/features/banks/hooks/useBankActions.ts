import type { UseFormSetError } from "react-hook-form";
import { useCreateBank, useUpdateBank, useDeleteBank } from "./useBanks";
import type { CreateBankDto, UpdateBankDto } from "../schemas/BankSchema";

export interface BankMutationCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over bank mutations: consistent handler APIs and aggregated loading
 * state. Update/delete are keyed by the organization sequence (`BOrgSecuencia`).
 */
export function useBankActions(setError?: UseFormSetError<CreateBankDto>) {
  const createMutation = useCreateBank(setError);
  const updateMutation = useUpdateBank(setError);
  const deleteMutation = useDeleteBank();

  const handleCreate = (
    data: CreateBankDto,
    callbacks?: BankMutationCallbacks,
  ) => {
    createMutation.mutate(data, { onSuccess: callbacks?.onSuccess });
  };

  const handleUpdate = (
    sequence: number,
    data: UpdateBankDto,
    callbacks?: BankMutationCallbacks,
  ) => {
    updateMutation.mutate(
      { sequence, data },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const handleDelete = (sequence: number, callbacks?: BankMutationCallbacks) => {
    deleteMutation.mutate(sequence, { onSuccess: callbacks?.onSuccess });
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
