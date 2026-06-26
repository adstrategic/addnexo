import type { UseFormSetError } from "react-hook-form";
import {
  useCreateVendor,
  useDeleteVendor,
  useUpdateVendor,
} from "./useVendors";

import {
  type CreateVendorDto,
  type UpdateVendorDto,
} from "../schemas/VendorSchema";

export interface VendorMutationCallbacks {
  onSuccess?: () => void;
}

export function useVendorActions(setError?: UseFormSetError<CreateVendorDto>) {
  const createMutation = useCreateVendor(setError);
  const updateMutation = useUpdateVendor(setError);
  const deleteMutation = useDeleteVendor();

  const handleCreate = (
    data: CreateVendorDto,
    callbacks?: VendorMutationCallbacks,
  ) => {
    createMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    id: number,
    data: UpdateVendorDto,
    callbacks?: VendorMutationCallbacks,
  ) => {
    updateMutation.mutate({ id, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (id: number, callbacks?: VendorMutationCallbacks) => {
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
