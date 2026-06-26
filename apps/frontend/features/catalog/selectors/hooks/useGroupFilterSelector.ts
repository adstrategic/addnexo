"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { groupsService } from "@/features/inventory-groups/service/groups.service";
import { groupKeys } from "@/features/inventory-groups/hooks/useGroups";
import type { Grupo } from "../../types/server-types";

function useGroupById(id: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [...groupKeys.all, "filterById", id] as const,
    queryFn: async () => {
      const response = await groupsService.list({ limit: 100, page: 1 });
      return response.data.find((group) => group.GId === id) ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupFilterSelector(value?: number) {
  const [groupQuery, setGroupQuery] = useState("");
  const [openGroups, setOpenGroups] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Grupo | null>(null);

  const debouncedQuery = useDebouncedValue(groupQuery, 300);

  const shouldFetch =
    openGroups && (!hasUserInteracted || debouncedQuery === groupQuery);

  const {
    data: groupsData,
    isFetching: loadingGroups,
    isFetched,
  } = useQuery({
    queryKey: groupKeys.list({
      search: shouldFetch ? debouncedQuery || undefined : undefined,
      limit: 50,
    }),
    queryFn: () =>
      groupsService.list({
        search: debouncedQuery || undefined,
        limit: 50,
        page: 1,
      }),
    enabled: shouldFetch,
    staleTime: 30 * 1000,
  });

  const { data: resolvedGroup } = useGroupById(
    value,
    value != null && selectedGroup?.GId !== value,
  );

  useEffect(() => {
    if (value == null) {
      setSelectedGroup(null);
      return;
    }

    if (resolvedGroup) {
      setSelectedGroup(resolvedGroup);
    }
  }, [value, resolvedGroup]);

  const handleGroupSearch = useCallback((query: string) => {
    setGroupQuery(query);
    setHasUserInteracted(true);
  }, []);

  const toggleGroupPopover = useCallback(
    (open: boolean) => {
      setOpenGroups(open);
      if (!open) {
        setGroupQuery(
          selectedGroup
            ? `${selectedGroup.GNro} - ${selectedGroup.GDescripcion}`
            : "",
        );
        setHasUserInteracted(false);
      }
    },
    [selectedGroup],
  );

  const handleGroupSelect = useCallback((group: Grupo | null) => {
    setSelectedGroup(group);
    setOpenGroups(false);
    setGroupQuery(
      group ? `${group.GNro} - ${group.GDescripcion}` : "",
    );
    setHasUserInteracted(false);
  }, []);

  return {
    groupQuery,
    openGroups,
    groups: groupsData?.data ?? [],
    loadingGroups,
    isFetched,
    selectedGroup,
    handleGroupSearch,
    handleGroupSelect,
    toggleGroupPopover,
  };
}
