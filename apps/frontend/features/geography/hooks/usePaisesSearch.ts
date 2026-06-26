"use client";

import { useQuery } from "@tanstack/react-query";
import {
  searchPaises,
  type PaisOption,
} from "../service/paises.service";

export const paisKeys = {
  all: ["paises"] as const,
  search: (q: string) => [...paisKeys.all, "search", q] as const,
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

export type { PaisOption };
