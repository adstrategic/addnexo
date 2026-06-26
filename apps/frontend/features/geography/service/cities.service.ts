import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CityListResponse,
  CityResponse,
  ListCitiesParams,
} from "../schemas/cities.schema";
import {
  cityListResponseSchema,
  cityResponseSchema,
} from "../schemas/cities.schema";

/**
 * City search/list endpoint. Legacy path was `/api/inventario/search/ciudades`
 * (with apiClient base `/api/v1` → `/inventario/search/ciudades`).
 * Adjust when the backend geography module is finalized.
 */
const LIST_PATH = "/public/search/ciudades";

/** Single city by id — intended route when backend adds geography CRUD */
const cityDetailPath = (id: number) => `/geography/cities/${id}`;

async function listCities(
  params?: ListCitiesParams,
): Promise<CityListResponse> {
  try {
    const { data } = await apiClient.get<CityListResponse>(LIST_PATH, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });
    return cityListResponseSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getCityById(id: number): Promise<CityResponse> {
  try {
    const { data } = await apiClient.get<CityResponse>(cityDetailPath(id));
    return cityResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

export const citiesService = {
  list: listCities,
  getById: getCityById,
};
