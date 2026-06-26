import { useState, useCallback } from "react";
import { useSuppliers, SupplierResponse } from "@/features/suppliers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export const useProveedorSelector = (
  initialProveedor: SupplierResponse | null,
) => {
  // Inicializar con proveedor si se proporciona, sino ""
  const [proveedorQuery, setProveedorQuery] = useState(
    initialProveedor?.MPDescripcion || "",
  );
  const [openProveedores, setOpenProveedores] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Estado para guardar el proveedor seleccionado completo
  const [selectedProveedor, setSelectedProveedor] =
    useState<SupplierResponse | null>(initialProveedor || null);

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(proveedorQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === proveedorQuery;

  // Preparar initialData si hay proveedor inicial y el usuario no ha interactuado
  const initialData =
    initialProveedor && !hasUserInteracted
      ? {
          data: [initialProveedor],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar proveedores - solo cuando hay interacción del usuario
  const {
    data: proveedoresData,
    isFetching: loadingProveedores,
    isFetched,
  } = useSuppliers({
    search: shouldFetch ? debouncedQuery : undefined,
    enabled: shouldFetch,
    initialData,
  });

  // Calcular la lista a mostrar de forma simple
  const proveedores = proveedoresData?.data || [];

  // Función para manejar la búsqueda de proveedores
  const handleProveedorSearch = useCallback((query: string) => {
    setProveedorQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleProveedorPopover = useCallback(
    (open: boolean) => {
      setOpenProveedores(open);
      // Si se cierra, resetear el query al proveedor seleccionado
      if (!open) {
        setProveedorQuery(selectedProveedor?.MPDescripcion || "");
      }
    },
    [selectedProveedor],
  );

  // Función para manejar la selección de un proveedor
  const handleProveedorSelect = useCallback((proveedor: SupplierResponse) => {
    setSelectedProveedor(proveedor);
    setOpenProveedores(false);
    // Resetear el query al proveedor seleccionado
    setProveedorQuery(proveedor.MPDescripcion);
  }, []);

  return {
    proveedorQuery,
    openProveedores,
    proveedores,
    loadingProveedores,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedProveedor,
    handleProveedorSearch,
    handleProveedorSelect,
    toggleProveedorPopover,
  };
};
