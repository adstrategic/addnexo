"use client";

import { toast } from "sonner";
import {
  useCrearMovimientosBulk,
} from "./useMovements";
import type {
  MovementFormDataSingle,
} from "../schemas/movement-form-schema";

export function useMovementActions() {
  const crearMovimientosBulkMutation = useCrearMovimientosBulk();

  const handleCrearMovimientosBulk = async (payload: {
    lineas: MovementFormDataSingle[];
  }) => {
    const result = await crearMovimientosBulkMutation.mutateAsync(payload);
    const count = result.count ?? result.data?.length ?? 0;
    toast.success(
      count === 1 ? "Movement created successfully" : "Movements created successfully",
      { description: `Created ${count} movement(s).` },
    );
    return result;
  };

  return {
    handleCrearMovimientosBulk,
    isCreating: crearMovimientosBulkMutation.isPending,
  };
}
