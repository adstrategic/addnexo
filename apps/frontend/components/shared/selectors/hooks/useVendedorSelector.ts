import { useState, useCallback, useEffect } from "react";
import { useVendors } from "@/features/vendors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { VendorResponse } from "@/features/vendors";

export const useVendedorSelector = (initialVendedor: VendorResponse | null) => {
  // Inicializar con vendedor si se proporciona, sino ""
  const [vendedorQuery, setVendedorQuery] = useState(
    initialVendedor?.VNombre || "",
  );
  const [openVendedores, setOpenVendedores] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<VendorResponse | null>(
    initialVendedor || null,
  );

  useEffect(() => {
    if (initialVendedor) {
      setSelectedVendedor(initialVendedor);
      setVendedorQuery(initialVendedor.VNombre);
      setHasUserInteracted(true);
    }
  }, [initialVendedor]);

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(vendedorQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === vendedorQuery;

  // Preparar initialData si hay vendedor inicial y el usuario no ha interactuado
  const initialData =
    initialVendedor && !hasUserInteracted
      ? {
          data: [initialVendedor],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar vendedores - solo cuando hay interacción del usuario
  const {
    data: vendedoresData,
    isFetching: loadingVendedores,
    isFetched,
  } = useVendors({
    search: shouldFetch ? debouncedQuery : undefined,
    enabled: true,
    initialData, // Solo en modo edit, antes de primera interacción
  });

  // Calcular la lista a mostrar de forma simple
  const vendedores = vendedoresData?.data || [];

  // Función para manejar la búsqueda de vendedores
  const handleVendedorSearch = useCallback((query: string) => {
    setVendedorQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleVendedorPopover = useCallback(
    (open: boolean) => {
      setOpenVendedores(open);
      // Si se cierra, resetear el query al vendedor seleccionado
      if (!open) {
        setVendedorQuery(selectedVendedor?.VNombre || "");
      }
    },
    [selectedVendedor],
  );

  // Función para manejar la selección de un vendedor
  const handleVendedorSelect = useCallback((vendedor: VendorResponse) => {
    setSelectedVendedor(vendedor);
    setOpenVendedores(false);
    // Resetear el query al vendedor seleccionado
    setVendedorQuery(vendedor.VNombre);
  }, []);

  // Función para limpiar la selección (seleccionar "None")
  const handleVendedorClear = useCallback(() => {
    setSelectedVendedor(null);
    setVendedorQuery("");
    setOpenVendedores(false);
  }, []);

  return {
    vendedorQuery,
    openVendedores,
    vendedores,
    loadingVendedores,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedVendedor,
    handleVendedorSearch,
    handleVendedorSelect,
    handleVendedorClear,
    toggleVendedorPopover,
  };
};
