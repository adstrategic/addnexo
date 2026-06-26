import { useState, useCallback } from "react";
import { useBanks } from "@/features/banks/hooks/useBanks";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { BankResponse } from "@/features/banks/schemas/BankSchema";

export const useBankSelector = (initialBank: BankResponse | null) => {
  // Inicializar con banco si se proporciona, sino ""
  const [bankQuery, setBankQuery] = useState(initialBank?.BNombre || "");
  const [openBanks, setOpenBanks] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  // Estado para guardar el banco seleccionado completo
  const [selectedBank, setSelectedBank] = useState<BankResponse | null>(
    initialBank || null,
  );

  // Debounce de la búsqueda para evitar llamadas por cada tecla
  const debouncedQuery = useDebouncedValue(bankQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === bankQuery;

  // Preparar initialData si hay banco inicial y el usuario no ha interactuado
  const initialData =
    initialBank && !hasUserInteracted
      ? {
          data: [initialBank],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  // Query para buscar bancos - solo cuando hay interacción del usuario
  const {
    data: banksData,
    isFetching: loadingBanks,
    isFetched,
  } = useBanks({
    search: shouldFetch ? debouncedQuery : undefined,
    initialData, // Solo en modo edit, antes de primera interacción
  });

  // Calcular la lista a mostrar de forma simple
  const banks = banksData?.data || [];

  // Función para manejar la búsqueda de bancos
  const handleBankSearch = useCallback((query: string) => {
    setBankQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  // Función para abrir/cerrar el popover
  // Optimizada: resetea el query directamente cuando se cierra, sin useEffect
  const toggleBankPopover = useCallback(
    (open: boolean) => {
      setOpenBanks(open);
      // Si se cierra, resetear el query al banco seleccionado
      if (!open) {
        setBankQuery(selectedBank?.BNombre || "");
      }
    },
    [selectedBank],
  );

  // Función para manejar la selección de un banco
  const handleBankSelect = useCallback((bank: BankResponse) => {
    setSelectedBank(bank);
    setOpenBanks(false);
    // Resetear el query al banco seleccionado
    setBankQuery(bank.BNombre);
  }, []);

  return {
    bankQuery,
    openBanks,
    banks,
    loadingBanks,
    isFetched, // Indica si la búsqueda ya se completó al menos una vez
    hasUserInteracted,
    selectedBank,
    handleBankSearch,
    handleBankSelect,
    toggleBankPopover,
  };
};
