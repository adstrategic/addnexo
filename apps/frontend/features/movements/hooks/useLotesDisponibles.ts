import { useQuery } from "@tanstack/react-query";
import {
  movementsKeys,
  movementsApi,
} from "../services/movements.services";
import type { LoteDisponible } from "../types/server-types";

interface UseLotesDisponiblesParams {
  productoId?: number;
  almacenId?: number;
  ciudadId?: number;
  enabled?: boolean;
}

/**
 * Hook para obtener los lotes disponibles de un producto en un almacén específico
 *
 * @param productoId - ID del producto
 * @param almacenId - ID del almacén
 * @param ciudadId - ID de la ciudad (opcional)
 * @param enabled - Si la query debe ejecutarse (por defecto: true si hay producto y almacén)
 *
 * @returns Query con los lotes disponibles ordenados por FIFO
 */
export function useLotesDisponibles({
  productoId,
  almacenId,
  ciudadId,
  enabled = true,
}: UseLotesDisponiblesParams) {
  // Solo habilitar la query si hay producto y almacén definidos
  const shouldFetch = enabled && !!productoId && !!almacenId;

  return useQuery<LoteDisponible[], Error>({
    queryKey: movementsKeys.lotesDisponibles(productoId, almacenId, ciudadId),
    queryFn: async () => {
      if (!productoId || !almacenId) {
        return [];
      }
      return movementsApi.obtenerLotesDisponibles(productoId, almacenId, ciudadId);
    },
    enabled: shouldFetch,
    staleTime: 2 * 60 * 1000, // 2 minutos - tiempo corto porque el inventario cambia frecuentemente
    retry: 1, // Solo reintentar una vez en caso de error
  });
}
