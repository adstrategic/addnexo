/**
 * Geography feature — cities read API for selectors and future admin UI.
 */

export {
  listCitiesParamsSchema,
  cityPaisSchema,
  cityEstadoSchema,
  cityResponseSchema,
  cityListResponseSchema,
  type ListCitiesParams,
  type CityPais,
  type CityEstado,
  type CityResponse,
  type CityListResponse,
} from "./schemas/cities.schema";

/** Legacy names for selectors and forms using Spanish types */
export type { CityResponse as Ciudad, CityListResponse as CiudadesResponse } from "./schemas/cities.schema";

export { citiesService } from "./service/cities.service";

export {
  cityKeys,
  useCities,
  useCityById,
} from "./hooks/useCities";

export { searchPaises } from "./service/paises.service";
export type { PaisOption } from "./service/paises.service";
export { paisKeys, usePaisesSearch, usePaisById } from "./hooks/usePaisesSearch";
