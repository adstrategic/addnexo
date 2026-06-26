"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ListCitiesParams, CityListResponse } from "../schemas/cities.schema";
import { citiesService } from "../service/cities.service";

export const cityKeys = {
  all: ["cities"] as const,
  lists: () => [...cityKeys.all, "list"] as const,
  list: (params: ListCitiesParams) => [...cityKeys.lists(), params] as const,
  details: () => [...cityKeys.all, "detail"] as const,
  detail: (id: number) => [...cityKeys.details(), id] as const,
};

type UseCitiesOptions = ListCitiesParams & {
  enabled?: boolean;
  initialData?: CityListResponse;
};

export function useCities(params?: UseCitiesOptions) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: cityKeys.list(queryParams),
    queryFn: () => citiesService.list(queryParams),
    enabled,
    initialData,
    placeholderData: keepPreviousData,
  });
}

export function useCityById(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: cityKeys.detail(id),
    queryFn: () => citiesService.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000,
  });
}
