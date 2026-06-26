import type { UseFormSetError } from "react-hook-form";
import {
  useUpdateDispatchOrder,
  useEmitDispatchOrder,
  useCreateDispatchOrderHeader,
  useDeleteDispatchOrder,
} from "./useDispatchOrders";
import type {
  UpdateDispatchOrderData,
  CreateDispatchOrderHeaderData,
} from "../schemas/dispatch-order-schema";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";

export interface DispatchOrderMutationCallbacks {
  onSuccess?: (data: DispatchOrderResponse) => void;
}

export interface DispatchOrderDeleteCallbacks {
  onSuccess?: () => void;
}

/**
 * Facade over dispatch-order mutations: consistent handler APIs and aggregated loading state.
 */
export function useDispatchOrderActions(
  setError?: UseFormSetError<CreateDispatchOrderHeaderData>,
) {
  const createHeaderMutation = useCreateDispatchOrderHeader(setError);
  const updateMutation = useUpdateDispatchOrder(setError);
  const emitMutation = useEmitDispatchOrder(setError);
  const deleteMutation = useDeleteDispatchOrder();

  const handleCreate = (
    data: CreateDispatchOrderHeaderData,
    callbacks?: DispatchOrderMutationCallbacks,
  ) => {
    createHeaderMutation.mutate(data, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  const handleUpdate = (
    secuencia: number,
    data: UpdateDispatchOrderData,
    callbacks?: DispatchOrderMutationCallbacks,
  ) => {
    updateMutation.mutate(
      { secuencia, data },
      { onSuccess: callbacks?.onSuccess },
    );
  };

  const handleEmit = (
    secuencia: number,
    data: UpdateDispatchOrderData,
    callbacks?: DispatchOrderMutationCallbacks,
  ) => {
    emitMutation.mutate({ secuencia, data }, { onSuccess: callbacks?.onSuccess });
  };

  const handleDelete = (
    secuencia: number,
    callbacks?: DispatchOrderDeleteCallbacks,
  ) => {
    deleteMutation.mutate(secuencia, {
      onSuccess: callbacks?.onSuccess,
    });
  };

  return {
    handleCreate,
    handleUpdate,
    handleEmit,
    handleDelete,
    isCreating: createHeaderMutation.isPending,
    isUpdating: updateMutation.isPending,
    isEmitting: emitMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMutating:
      createHeaderMutation.isPending ||
      updateMutation.isPending ||
      emitMutation.isPending,
  };
}
