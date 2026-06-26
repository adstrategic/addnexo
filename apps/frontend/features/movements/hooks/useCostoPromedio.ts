import { useQuery } from "@tanstack/react-query";
import {
  movementsKeys,
  movementsApi,
} from "../services/movements.services";

interface CostoPromedioParams {
  productoId?: number;
  almacenId?: number;
}

/**
 * Hook para obtener el costo promedio de un producto en un almacén
 *
 * @param productoId - ID del producto
 * @param almacenId - ID del almacén
 *
 * @returns Query con el costo promedio
 */
export const useCostoPromedio = ({
  productoId,
  almacenId,
}: CostoPromedioParams) => {
  const shouldFetch = productoId !== undefined && almacenId !== undefined;

  return useQuery<number>({
    queryKey: movementsKeys.costoPromedio(productoId, almacenId),
    queryFn: async () => {
      if (!productoId || !almacenId) {
        return 0;
      }
      return movementsApi.obtenerCostoPromedio(productoId, almacenId);
    },
    enabled: !!shouldFetch,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
  });
};
