import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementTypesApi } from "../services/movement-types.services";
import type { TiposMovimientoResponse } from "../types/server-types";
import {
  type MovementTypeFormData,
  type ActualizarMovementTypeData,
} from "../schemas/movement-type-schema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

export interface ListMovementTypesParams {
  page?: number;
  search?: string;
  enabled?: boolean;
  initialData?: TiposMovimientoResponse;
}

export const movementTypeKeys = {
  all: ["movement-types"] as const,
  lists: () => [...movementTypeKeys.all, "list"] as const,
  list: (
    params?: Omit<ListMovementTypesParams, "enabled" | "initialData">,
  ) => [...movementTypeKeys.lists(), params] as const,
  details: () => [...movementTypeKeys.all, "detail"] as const,
  detail: (sequence: number) => [...movementTypeKeys.details(), sequence] as const,
  bySequence: (sequence: number) =>
    [...movementTypeKeys.details(), "sequence", sequence] as const,
  availablePurposes: () =>
    [...movementTypeKeys.all, "available-purposes"] as const,
  availablePurposesBy: (excludeTmovkarId?: number) =>
    [...movementTypeKeys.availablePurposes(), excludeTmovkarId] as const,
  nextAvailableClass: () =>
    [...movementTypeKeys.all, "next-available-class"] as const,
  nextAvailableClassBy: (tipo: number) =>
    [...movementTypeKeys.nextAvailableClass(), tipo] as const,
};

export function useMovementTypes(params?: ListMovementTypesParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: movementTypeKeys.list(queryParams),
    queryFn: () => movementTypesApi.obtenerTiposMovimiento(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useMovementType(
  sequence: number | null,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: movementTypeKeys.bySequence(sequence ?? 0),
    queryFn: () => movementTypesApi.obtenerTipoMovimiento(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMovementType(
  setError?: UseFormSetError<MovementTypeFormData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MovementTypeFormData) => movementTypesApi.crearTipoMovimiento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementTypeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.availablePurposes(),
      });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.nextAvailableClass(),
      });
      toast.success("Movement type created", {
        description: "The movement type has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateMovementType(
  setError?: UseFormSetError<MovementTypeFormData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarMovementTypeData }) =>
      movementTypesApi.actualizarTipoMovimiento(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: movementTypeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.bySequence(updated.TOrgSecuencia),
      });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.availablePurposes(),
      });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.nextAvailableClass(),
      });
      toast.success("Movement type updated", {
        description: "The movement type has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteMovementType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; sequence: number }) =>
      movementTypesApi.eliminarTipoMovimiento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementTypeKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.availablePurposes(),
      });
      queryClient.invalidateQueries({
        queryKey: movementTypeKeys.nextAvailableClass(),
      });
      toast.success("Movement type deleted", {
        description: "The movement type has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}

export function usePropositosDisponibles(excludeTmovkarId?: number) {
  return useQuery({
    queryKey: movementTypeKeys.availablePurposesBy(excludeTmovkarId),
    queryFn: () =>
      movementTypesApi.obtenerPropositosDisponibles(excludeTmovkarId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNextAvailableClass(tipo: number | undefined) {
  return useQuery({
    queryKey: movementTypeKeys.nextAvailableClassBy(tipo!),
    queryFn: () => movementTypesApi.obtenerSiguienteClaseDisponible(tipo!),
    enabled: !!tipo && (tipo === 1 || tipo === 2),
    staleTime: 30 * 1000,
  });
}
