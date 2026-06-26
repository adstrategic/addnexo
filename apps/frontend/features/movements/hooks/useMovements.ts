import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { movementsKeys, movementsApi } from "../services/movements.services";
import { useMovementTypesQueries } from "@/features/movement-types/services/movement-types.services";
import type { FiltrosMovimientos } from "../types/server-types";
import type {
  MovementFormData,
  MovementFormDataSingle,
} from "../schemas/movement-form-schema";

// Hook para obtener lista de movimientos
export function useMovements(params?: FiltrosMovimientos) {
  return useQuery({
    queryKey: movementsKeys.list(params ?? {}),
    queryFn: () => movementsApi.obtenerMovimientos(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Hook para obtener un movimiento específico
export function useMovement(secuencial: number) {
  return useQuery({
    queryKey: movementsKeys.detailBySequence(secuencial),
    queryFn: () => movementsApi.obtenerMovimiento(secuencial),
    enabled: !!secuencial,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para crear movimiento
export function useCrearMovimiento() {
  const queryClient = useQueryClient();
  const movementTypesQueries = useMovementTypesQueries();

  return useMutation({
    mutationFn: (data: MovementFormData) => movementsApi.crearMovimiento(data),
    onSuccess: () => {
      // Invalidar todas las listas de movimientos
      queryClient.invalidateQueries({ queryKey: movementsKeys.lists() });
      // Invalidar next-available-class para que el cache no devuelva un valor obsoleto
      queryClient.invalidateQueries({
        queryKey: movementTypesQueries.keys.nextAvailableClassPrefix(),
      });
    },
  });
}

// Hook para crear múltiples movimientos en una sola petición (bulk)
export function useCrearMovimientosBulk() {
  const queryClient = useQueryClient();
  const movementTypesQueries = useMovementTypesQueries();

  return useMutation({
    mutationFn: (payload: { lineas: MovementFormDataSingle[] }) =>
      movementsApi.crearMovimientosBulk(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movementsKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: movementTypesQueries.keys.nextAvailableClassPrefix(),
      });
    },
  });
}

// Hook para buscar ciudades
export function useBuscarCiudades(query: string) {
  return useQuery({
    queryKey: movementsKeys.ciudades(query),
    queryFn: () => movementsApi.buscarCiudades(query),
    enabled: query.length >= 2,
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hook para obtener último lote disponible
export function useUltimoLote({
  productoId,
  almacenId,
  nroDocumento,
  enabled = true,
}: {
  productoId?: number;
  almacenId?: number;
  nroDocumento?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: movementsKeys.ultimoLote({ productoId, almacenId, nroDocumento }),
    queryFn: () =>
      movementsApi.obtenerUltimoLote({
        invcaruniId: productoId!,
        almacenId: almacenId!,
        nroDocumento,
      }),
    enabled: enabled && !!productoId && !!almacenId,
    staleTime: 30 * 1000, // 30 segundos
  });
}
