import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import {
  TipoMovimiento,
  CrearTipoMovimientoData,
  ActualizarTipoMovimientoData,
  TiposMovimientoResponse,
  TipoPropositoMovkar,
} from "../types/server-types";

const BASE_URL = "/movement-types";

// API Functions
export const movementTypesApi = {
  // Obtener todos los tipos de movimiento con paginación y búsqueda.
  // El tamaño de página lo define el servidor (no se envía limit)
  async obtenerTiposMovimiento(params?: {
    page?: number;
    search?: string;
  }): Promise<TiposMovimientoResponse> {
    try {
      const { data } = await apiClient.get<TiposMovimientoResponse>(BASE_URL, {
        params: {
          page: params?.page ?? 1,
          search: params?.search,
        },
      });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener tipo de movimiento por secuencia
  async obtenerTipoMovimiento(orgSecuencia: number): Promise<TipoMovimiento> {
    try {
      const { data } = await apiClient.get<TipoMovimiento>(
        `${BASE_URL}/${orgSecuencia}`,
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear nuevo tipo de movimiento
  async crearTipoMovimiento(
    data: CrearTipoMovimientoData,
  ): Promise<TipoMovimiento> {
    try {
      const { data: responseData } = await apiClient.post<TipoMovimiento>(
        BASE_URL,
        data,
      );
      return responseData;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Actualizar tipo de movimiento
  // Supports partial updates (PATCH) - only sends changed fields
  async actualizarTipoMovimiento(
    id: number,
    data: ActualizarTipoMovimientoData,
  ): Promise<TipoMovimiento> {
    try {
      const { data: responseData } = await apiClient.patch<TipoMovimiento>(
        `${BASE_URL}/${id}`,
        data,
      );
      return responseData;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Eliminar tipo de movimiento
  async eliminarTipoMovimiento(id: number): Promise<{ message: string }> {
    try {
      await apiClient.delete(`${BASE_URL}/${id}`);
      return { message: "Movement type deleted successfully" };
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener propósitos disponibles (propósitos no asignados aún)
  async obtenerPropositosDisponibles(
    excludeTmovkarId?: number,
  ): Promise<TipoPropositoMovkar[]> {
    try {
      const { data } = await apiClient.get<{ data: TipoPropositoMovkar[] }>(
        `${BASE_URL}/available-purposes`,
        {
          params: {
            excludeTmovkarId,
          },
        },
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get next available class number for a movement type
  async obtenerSiguienteClaseDisponible(
    tipo: number,
  ): Promise<{ nextClass: number }> {
    try {
      const { data } = await apiClient.get<{ nextClass: number }>(
        `${BASE_URL}/next-available-class`,
        {
          params: { tipo },
        },
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

export const movementTypesKeys = {
  all: ["movement-types"] as const,
  lists: () => [...movementTypesKeys.all, "list"] as const,
  list: (params: { page?: number; search?: string }) =>
    [...movementTypesKeys.lists(), params] as const,
  details: () => [...movementTypesKeys.all, "detail"] as const,
  detail: (secuencia: number) =>
    [...movementTypesKeys.details(), secuencia] as const,
  detailBySequence: (secuencia: number) =>
    [...movementTypesKeys.details(), "sequence", secuencia] as const,
  availablePurposes: (excludeTmovkarId?: number) =>
    [...movementTypesKeys.all, "available-purposes", excludeTmovkarId] as const,
  nextAvailableClass: (tipo: number) =>
    [...movementTypesKeys.all, "next-available-class", tipo] as const,
  // Prefix to invalidate all next-available-class queries.
  nextAvailableClassPrefix: () =>
    [...movementTypesKeys.all, "next-available-class"] as const,
} as const;

export const useMovementTypesQueries = () => {
  return {
    keys: movementTypesKeys,
  };
};

export default movementTypesApi;
