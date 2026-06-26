import { useState, useCallback } from "react";
import { useGroups } from "@/features/inventory-groups/";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Grupo } from "../../types/server-types";

export const useGroupSelector = (initialGroup: Grupo | null) => {
  // Inicializar con grupo si se proporciona, sino ""
  const [groupQuery, setGroupQuery] = useState(
    initialGroup ? `${initialGroup.GNro} - ${initialGroup.GDescripcion}` : "",
  );
  const [openGroups, setOpenGroups] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Estado para guardar el grupo seleccionado completo
  const [selectedGroup, setSelectedGroup] = useState<Grupo | null>(
    initialGroup || null,
  );

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(groupQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === groupQuery;

  // Preparar initialData si hay grupo inicial y el usuario no ha interactuado
  const initialData =
    initialGroup && !hasUserInteracted
      ? {
          data: [initialGroup],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar grupos - solo cuando hay interacción del usuario
  const {
    data: groupsData,
    isFetching: loadingGroups,
    isFetched,
  } = useGroups({
    search: shouldFetch ? debouncedQuery : undefined,
  });

  // Calcular la lista a mostrar de forma simple
  const groups = groupsData?.data || [];

  // Función para manejar la búsqueda de grupos
  const handleGroupSearch = useCallback((query: string) => {
    setGroupQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleGroupPopover = useCallback(
    (open: boolean) => {
      setOpenGroups(open);
      // Si se cierra, resetear el query al grupo seleccionado
      if (!open) {
        setGroupQuery(
          selectedGroup
            ? `${selectedGroup.GNro} - ${selectedGroup.GDescripcion}`
            : "",
        );
      }
    },
    [selectedGroup],
  );

  // Función para manejar la selección de un grupo
  const handleGroupSelect = useCallback((group: Grupo) => {
    setSelectedGroup(group);
    setOpenGroups(false);
    // Resetear el query al grupo seleccionado
    setGroupQuery(`${group.GNro} - ${group.GDescripcion}`);
  }, []);

  return {
    groupQuery,
    openGroups,
    groups,
    loadingGroups,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedGroup,
    handleGroupSearch,
    handleGroupSelect,
    toggleGroupPopover,
  };
};
