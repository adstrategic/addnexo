import { useMemo } from "react";
import { useAlmacenes } from "@/features/warehouses";

/**
 * Hook to get the first warehouse of the organization
 * Returns the warehouse with the lowest ALOrgSecuencia (first warehouse)
 */
export function useFirstAlmacen() {
  const { data, isLoading, error } = useAlmacenes();

  const firstAlmacen = useMemo(() => {
    if (!data?.data || data.data.length === 0) {
      return null;
    }
    // Warehouses are already ordered by ALOrgSecuencia ASC from the API
    return data.data[0];
  }, [data]);

  return {
    almacen: firstAlmacen,
    almacenId: firstAlmacen?.ALId,
    isLoading,
    error,
  };
}
