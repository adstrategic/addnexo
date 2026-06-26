import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  movementsKeys,
  movementsApi,
} from "../services/movements.services";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";

interface ActualizarCostoParams {
  movimientoId: number;
  nuevoCosto: number;
}

export function useActualizarCosto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ movimientoId, nuevoCosto }: ActualizarCostoParams) =>
      movementsApi.actualizarCostoCero(movimientoId, nuevoCosto),
    onSuccess: (data) => {
      // Invalidar todas las listas de movimientos
      queryClient.invalidateQueries({ queryKey: movementsKeys.lists() });

      toast.success("Cost updated successfully", {
        description: `${data.data.salidasActualizadas} subsequent exits were updated`,
      });
    },
    onError: (error) => {
      handleMutationError(error);
    },
  });
}
