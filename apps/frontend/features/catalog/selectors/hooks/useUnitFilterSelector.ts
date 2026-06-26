"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { unitsService } from "@/features/measurement-types/service/units.service";
import { unitKeys } from "@/features/measurement-types/hooks/useUnits";
import type { Unidad } from "../../types/server-types";

function useUnitById(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...unitKeys.all, "filterById", id] as const,
    queryFn: async () => {
      const response = await unitsService.list({ limit: 100, page: 1 });
      return response.data.find((unit) => unit.UMId === id) ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUnitFilterSelector(value?: number) {
  const [unitQuery, setUnitQuery] = useState("");
  const [openUnits, setOpenUnits] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unidad | null>(null);

  const debouncedQuery = useDebouncedValue(unitQuery, 300);

  const shouldFetch =
    openUnits && (!hasUserInteracted || debouncedQuery === unitQuery);

  const {
    data: unitsData,
    isFetching: loadingUnits,
    isFetched,
  } = useQuery({
    queryKey: unitKeys.list({
      search: shouldFetch ? debouncedQuery || undefined : undefined,
      limit: 50,
    }),
    queryFn: () =>
      unitsService.list({
        search: debouncedQuery || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000,
  });

  const { data: resolvedUnit } = useUnitById(
    value,
    value != null && selectedUnit?.UMId !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedUnit(null);
      return;
    }

    if (resolvedUnit) {
      setSelectedUnit(resolvedUnit);
    }
  }, [value, resolvedUnit]);

  const handleUnitSearch = useCallback((query: string) => {
    setUnitQuery(query);
    setHasUserInteracted(true);
  }, []);

  const toggleUnitPopover = useCallback(
    (open: boolean) => {
      setOpenUnits(open);
      if (!open) {
        setUnitQuery(
          selectedUnit
            ? `${selectedUnit.UMNombre} - ${selectedUnit.UMDescripcion}`
            : "",
        );
        setHasUserInteracted(false);
      }
    },
    [selectedUnit],
  );

  const handleUnitSelect = useCallback((unit: Unidad | null) => {
    setSelectedUnit(unit);
    setOpenUnits(false);
    setUnitQuery(unit ? `${unit.UMNombre} - ${unit.UMDescripcion}` : "");
    setHasUserInteracted(false);
  }, []);

  return {
    unitQuery,
    openUnits,
    units: unitsData?.data ?? [],
    loadingUnits,
    isFetched,
    selectedUnit,
    handleUnitSearch,
    handleUnitSelect,
    toggleUnitPopover,
  };
}
