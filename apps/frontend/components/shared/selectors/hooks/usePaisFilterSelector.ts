"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  usePaisesSearch,
  usePaisById,
  type PaisOption,
} from "@/features/geography/hooks/usePaisesSearch";

export const usePaisFilterSelector = (value?: number) => {
  const [paisQuery, setPaisQuery] = useState("");
  const [openPaises, setOpenPaises] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedPais, setSelectedPais] = useState<PaisOption | null>(null);

  const debouncedQuery = useDebouncedValue(paisQuery, 300);

  const shouldFetch =
    openPaises && (!hasUserInteracted || debouncedQuery === paisQuery);

  const {
    data: paises = [],
    isFetching: loadingPaises,
    isFetched,
  } = usePaisesSearch({
    query: debouncedQuery.trim(),
    enabled: shouldFetch,
  });

  const { data: resolvedPais } = usePaisById(
    value,
    value != null && selectedPais?.id !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedPais(null);
      return;
    }

    if (resolvedPais) {
      setSelectedPais(resolvedPais);
    }
  }, [value, resolvedPais]);

  const handlePaisSearch = useCallback((query: string) => {
    setPaisQuery(query);
    setHasUserInteracted(true);
  }, []);

  const togglePaisPopover = useCallback(
    (open: boolean) => {
      setOpenPaises(open);
      if (!open) {
        setPaisQuery(selectedPais?.nombre ?? "");
        setHasUserInteracted(false);
      }
    },
    [selectedPais],
  );

  const handlePaisSelect = useCallback((pais: PaisOption | null) => {
    setSelectedPais(pais);
    setOpenPaises(false);
    setPaisQuery(pais?.nombre ?? "");
    setHasUserInteracted(false);
  }, []);

  return {
    paisQuery,
    openPaises,
    paises,
    loadingPaises,
    isFetched,
    selectedPais,
    handlePaisSearch,
    handlePaisSelect,
    togglePaisPopover,
  };
};
