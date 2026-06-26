import { useMemo } from "react";
import { useAlmacenes } from "@/features/warehouses";

/**
 * Hook to get the first almacen of the organization
 * Returns the almacen with the lowest ALOrgSecuencia (first almacen)
 */
export function useFirstAlmacen() {
  const { data, isLoading, error } = useAlmacenes();

  const firstAlmacen = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return null;
    }
    // Almacenes are already ordered by ALOrgSecuencia ASC from the API
    return data.data[0];
  }, [data]);

  return {
    almacen: firstAlmacen,
    almacenId: firstAlmacen?.ALId,
    isLoading,
    error,
  };
}
