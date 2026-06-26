import { useState, useCallback } from "react";
import { useClients } from "@/features/clients/hooks/useClients";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { ClienteResponse } from "@/features/clients/schemas/ClientSchema";

export const useClienteSelector = (initialCliente: ClienteResponse | null) => {
  // Inicializar con cliente si se proporciona, sino ""
  const [clienteQuery, setClienteQuery] = useState(
    initialCliente?.CRazonSocial || "",
  );
  const [openClientes, setOpenClientes] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Estado para guardar el cliente seleccionado completo
  const [selectedCliente, setSelectedCliente] =
    useState<ClienteResponse | null>(initialCliente || null);

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(clienteQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === clienteQuery;

  // Preparar initialData si hay cliente inicial y el usuario no ha interactuado
  const initialData =
    initialCliente && !hasUserInteracted
      ? {
          data: [initialCliente],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar clientes - solo cuando hay interacción del usuario
  const {
    data: clientesData,
    isFetching: loadingClientes,
    isFetched,
  } = useClients({
    search: shouldFetch ? debouncedQuery : undefined,
    // enabled: true,
    initialData, // Solo en modo edit, antes de primera interacción
  });

  // Calcular la lista a mostrar de forma simple
  const clientes = clientesData?.data || [];

  // Función para manejar la búsqueda de clientes
  const handleClienteSearch = useCallback((query: string) => {
    setClienteQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleClientePopover = useCallback(
    (open: boolean) => {
      setOpenClientes(open);
      // Si se cierra, resetear el query al cliente seleccionado
      if (!open) {
        setClienteQuery(selectedCliente?.CRazonSocial || "");
      }
    },
    [selectedCliente],
  );

  // Función para manejar la selección de un cliente
  const handleClienteSelect = useCallback((cliente: ClienteResponse) => {
    setSelectedCliente(cliente);
    setOpenClientes(false);
    // Resetear el query al cliente seleccionado
    setClienteQuery(cliente.CRazonSocial);
  }, []);

  return {
    clienteQuery,
    openClientes,
    clientes,
    loadingClientes,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedCliente,
    handleClienteSearch,
    handleClienteSelect,
    toggleClientePopover,
  };
};
