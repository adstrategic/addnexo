import { useState, useCallback } from "react";
import { useMovementTypes } from "@/features/movement-types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { TipoMovimiento } from "@/features/movement-types";

export const useTipoMovimientoSelector = (
  initialTipoMovimiento: TipoMovimiento | null,
) => {
  const [tipoQuery, setTipoQuery] = useState("");
  const [openTipos, setOpenTipos] = useState(false);
  // Estado para guardar el tipo de movimiento seleccionado completo
  const [selectedTipo, setSelectedTipo] = useState<TipoMovimiento | null>(
    initialTipoMovimiento,
  );

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(tipoQuery, 300);

  // Los tipos de movimiento son pocos: se cargan de inmediato para mostrar
  // la lista al abrir, y se filtran en el servidor mientras se escribe.
  // El tamaño de página lo define el servidor (DEFAULT_TIPOS_MOVIMIENTO_LIMIT)
  const {
    data: tiposData,
    isFetching: loadingTipos,
    isFetched,
  } = useMovementTypes({
    search: debouncedQuery || undefined,
  });

  const tipos = tiposData?.data || [];

  const handleTipoSearch = useCallback((query: string) => {
    setTipoQuery(query);
  }, []);

  // Función para abrir/cerrar el popover
  // Al cerrar se limpia el query para mostrar la lista completa al reabrir
  const toggleTipoPopover = useCallback((open: boolean) => {
    setOpenTipos(open);
    if (!open) {
      setTipoQuery("");
    }
  }, []);

  // Función para manejar la selección de un tipo de movimiento
  const handleTipoSelect = useCallback((tipo: TipoMovimiento) => {
    setSelectedTipo(tipo);
    setOpenTipos(false);
    setTipoQuery("");
  }, []);

  return {
    tipoQuery,
    openTipos,
    tipos,
    loadingTipos,
    isFetched,
    selectedTipo,
    handleTipoSearch,
    handleTipoSelect,
    toggleTipoPopover,
  };
};
