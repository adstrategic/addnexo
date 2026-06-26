"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchPaises,
  type PaisOption,
} from "../service/paises.service";

export const paisKeys = {
  all: ["paises"] as const,
  search: (q: string) => [...paisKeys.all, "search", q] as const,
  byId: (id: number) => [...paisKeys.all, "byId", id] as const,
};

type UsePaisesSearchOptions = {
  /** Debounced search string; empty string loads first page of countries */
  query: string;
  enabled?: boolean;
};

export function usePaisesSearch({
  query,
  enabled = true,
}: UsePaisesSearchOptions) {
  return useQuery({
    queryKey: paisKeys.search(query),
    queryFn: () => searchPaises(query),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePaisById(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: paisKeys.byId(id ?? 0),
    queryFn: async () => {
      const results = await searchPaises(undefined, { id: id! });
      return results[0] ?? null;
    },
    enabled: enabled && id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export type { PaisOption };
