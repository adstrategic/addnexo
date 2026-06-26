import { useState, useCallback, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  type Ciudad,
  type CiudadesResponse,
  useCities,
} from "@/features/geography";

export const useCiudadSelector = (initialCiudad: Ciudad | null) => {
  const [ciudadQuery, setCiudadQuery] = useState(initialCiudad?.nombre || "");
  const [openCiudades, setOpenCiudades] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedCiudad, setSelectedCiudad] = useState<Ciudad | null>(
    initialCiudad || null,
  );

  const debouncedQuery = useDebouncedValue(ciudadQuery, 300);

  const shouldFetch = hasUserInteracted && debouncedQuery === ciudadQuery;

  const initialData: CiudadesResponse | undefined =
    initialCiudad && !hasUserInteracted
      ? {
          data: [initialCiudad],
          pagination: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
          },
        }
      : undefined;

  const {
    data: ciudadesData,
    isFetching: loadingCiudades,
    isFetched,
  } = useCities({
    search: shouldFetch ? debouncedQuery : undefined,
    enabled: true,
    initialData,
  });

  useEffect(() => {
    if (initialCiudad) {
      setSelectedCiudad(initialCiudad);
      setCiudadQuery(initialCiudad.nombre);
      setHasUserInteracted(true);
    }
  }, [initialCiudad]);

  const ciudades = ciudadesData?.data || [];

  const handleCiudadSearch = useCallback((query: string) => {
    setCiudadQuery(query);
    setHasUserInteracted((prev) => {
      if (!prev) return true;
      return prev;
    });
  }, []);

  const toggleCiudadPopover = useCallback(
    (open: boolean) => {
      setOpenCiudades(open);
      if (!open) {
        setCiudadQuery(selectedCiudad?.nombre || "");
      }
    },
    [selectedCiudad],
  );

  const handleCiudadSelect = useCallback((ciudad: Ciudad) => {
    setSelectedCiudad(ciudad);
    setOpenCiudades(false);
    setCiudadQuery(ciudad.nombre);
  }, []);

  return {
    ciudadQuery,
    openCiudades,
    ciudades,
    loadingCiudades,
    isFetched,
    hasUserInteracted,
    selectedCiudad,
    handleCiudadSearch,
    handleCiudadSelect,
    toggleCiudadPopover,
  };
};
