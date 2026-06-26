"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaisesSearch, type PaisOption } from "@/features/geography/hooks/usePaisesSearch";

export const usePaisSelector = (initialPais: PaisOption | null) => {
  const [paisQuery, setPaisQuery] = useState(initialPais?.nombre || "");
  const [openPaises, setOpenPaises] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedPais, setSelectedPais] = useState<PaisOption | null>(
    initialPais || null,
  );

  const debouncedQuery = useDebouncedValue(paisQuery, 300);

  const shouldFetch =
    openPaises &&
    (!hasUserInteracted || debouncedQuery === paisQuery);

  const { data: paises = [], isFetching: loadingPaises, isFetched } =
    usePaisesSearch({
      query: debouncedQuery.trim(),
      enabled: shouldFetch,
    });

  useEffect(() => {
    if (initialPais) {
      setSelectedPais(initialPais);
      setPaisQuery(initialPais.nombre);
    }
  }, [initialPais]);

  const handlePaisSearch = useCallback((query: string) => {
    setPaisQuery(query);
    setHasUserInteracted(true);
  }, []);

  const togglePaisPopover = useCallback(
    (open: boolean) => {
      setOpenPaises(open);
      if (!open) {
        setPaisQuery(selectedPais?.nombre || "");
      }
    },
    [selectedPais],
  );

  const handlePaisSelect = useCallback((pais: PaisOption) => {
    setSelectedPais(pais);
    setOpenPaises(false);
    setPaisQuery(pais.nombre);
  }, []);

  return {
    paisQuery,
    openPaises,
    paises,
    loadingPaises,
    isFetched,
    hasUserInteracted,
    selectedPais,
    handlePaisSearch,
    handlePaisSelect,
    togglePaisPopover,
  };
};
