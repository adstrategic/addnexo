import { useState, useCallback } from "react";
import { useUnits } from "@/features/measurement-types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Unidad } from "../../types/server-types";

export const useUnitSelector = (initialUnit: Unidad | null) => {
  // Inicializar con unidad si se proporciona, sino ""
  const [unitQuery, setUnitQuery] = useState(
    initialUnit ? `${initialUnit.UMNombre} - ${initialUnit.UMDescripcion}` : "",
  );
  const [openUnits, setOpenUnits] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Estado para guardar la unidad seleccionada completa
  const [selectedUnit, setSelectedUnit] = useState<Unidad | null>(
    initialUnit || null,
  );

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(unitQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === unitQuery;

  // Preparar initialData si hay unidad inicial y el usuario no ha interactuado
  const initialData =
    initialUnit && !hasUserInteracted
      ? {
          data: [initialUnit],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar unidades - solo cuando hay interacción del usuario
  const {
    data: unitsData,
    isFetching: loadingUnits,
    isFetched,
  } = useUnits({
    search: shouldFetch ? debouncedQuery : undefined,
  });

  // Calcular la lista a mostrar de forma simple
  const units = unitsData?.data || [];

  // Función para manejar la búsqueda de unidades
  const handleUnitSearch = useCallback((query: string) => {
    setUnitQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleUnitPopover = useCallback(
    (open: boolean) => {
      setOpenUnits(open);
      // Si se cierra, resetear el query a la unidad seleccionada
      if (!open) {
        setUnitQuery(
          selectedUnit
            ? `${selectedUnit.UMNombre} - ${selectedUnit.UMDescripcion}`
            : "",
        );
      }
    },
    [selectedUnit],
  );

  // Función para manejar la selección de una unidad
  const handleUnitSelect = useCallback((unit: Unidad) => {
    setSelectedUnit(unit);
    setOpenUnits(false);
    // Resetear el query a la unidad seleccionada
    setUnitQuery(`${unit.UMNombre} - ${unit.UMDescripcion}`);
  }, []);

  return {
    unitQuery,
    openUnits,
    units,
    loadingUnits,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedUnit,
    handleUnitSearch,
    handleUnitSelect,
    toggleUnitPopover,
  };
};
