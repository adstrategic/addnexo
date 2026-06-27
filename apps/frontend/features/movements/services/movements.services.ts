import type { Producto } from "@/features/catalog";
import type { Ciudad } from "@/features/geography";
import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  FiltrosMovimientos,
  LoteDisponible,
  Movimiento,
  MovimientosResponse,
} from "../types/server-types";
import type {
  MovementFormData,
  MovementFormDataSingle,
} from "../schemas/movement-form-schema";

export const movementsKeys = {
  all: ["movements"] as const,
  lists: () => [...movementsKeys.all, "list"] as const,
  list: (params: FiltrosMovimientos = {}) =>
    [...movementsKeys.lists(), params] as const,
  details: () => [...movementsKeys.all, "detail"] as const,
  detailBySequence: (secuencial: number) =>
    [...movementsKeys.details(), "sequence", secuencial] as const,
  productos: (search?: string) =>
    [...movementsKeys.all, "productos", search ?? ""] as const,
  ciudades: (query: string) =>
    [...movementsKeys.all, "ciudades", query] as const,
  lotesDisponibles: (
    productoId?: number,
    almacenId?: number,
    ciudadId?: number,
  ) =>
    [
      ...movementsKeys.all,
      "lotes-disponibles",
      productoId ?? null,
      almacenId ?? null,
      ciudadId ?? null,
    ] as const,
  costoPromedio: (productoId?: number, almacenId?: number) =>
    [
      ...movementsKeys.all,
      "costo-promedio",
      productoId ?? null,
      almacenId ?? null,
    ] as const,
  ultimoLote: (params: {
    productoId?: number;
    almacenId?: number;
    nroDocumento?: string;
  }) =>
    [
      ...movementsKeys.all,
      "ultimo-lote",
      params.productoId ?? null,
      params.almacenId ?? null,
      params.nroDocumento ?? "",
    ] as const,
} as const;

const BASE_URL = "/movements";
const KARDEX_URL = "/kardex";

export const movementsApi = {
  // Obtener movimientos con filtros
  async obtenerMovimientos(
    params?: FiltrosMovimientos,
  ): Promise<MovimientosResponse> {
    try {
      const { data } = await apiClient.get<MovimientosResponse>(BASE_URL, {
        params,
      });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener movimiento por secuencial
  async obtenerMovimiento(secuencial: number): Promise<Movimiento> {
    try {
      const { data } = await apiClient.get<Movimiento>(
        `${BASE_URL}/${secuencial}`,
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear nuevo movimiento
  async crearMovimiento(
    data: MovementFormData,
  ): Promise<{ message: string; data: Movimiento }> {
    try {
      const response = await apiClient.post<{
        message: string;
        data: Movimiento;
      }>(BASE_URL, data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Crear múltiples movimientos en una sola petición (una transacción en backend)
  async crearMovimientosBulk(payload: {
    lineas: MovementFormDataSingle[];
  }): Promise<{ message: string; data: Movimiento[]; count: number }> {
    try {
      const response = await apiClient.post<{
        message: string;
        data: Movimiento[];
        count: number;
      }>(`${BASE_URL}/bulk`, payload);
      return response.data;
    } catch (error) {
      console.error(error);
      handleApiError(error);
    }
  },

  // Obtener productos
  async obtenerProductos(search?: string): Promise<Producto[]> {
    try {
      const { data } = await apiClient.get<{ data: Producto[] }>(
        `${BASE_URL}/productos`,
        {
          params: { search },
        },
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Buscar ciudades para autocompletado
  async buscarCiudades(query: string): Promise<Ciudad[]> {
    if (!query || query.length < 2) {
      return [];
    }
    try {
      const { data } = await apiClient.get<Ciudad[]>(
        `${BASE_URL}/search/ciudades`,
        {
          params: { q: query },
        },
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener lotes disponibles por producto y almacén
  async obtenerLotesDisponibles(
    productoId: number,
    almacenId: number,
    ciudadId?: number,
  ): Promise<LoteDisponible[]> {
    try {
      const { data } = await apiClient.get<{ data: LoteDisponible[] }>(
        `${KARDEX_URL}/lotes-disponibles`,
        {
          params: { productoId, almacenId, ciudadId },
        },
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener costo promedio de un producto en un almacén
  async obtenerCostoPromedio(
    productoId: number,
    almacenId: number,
  ): Promise<number> {
    try {
      const { data } = await apiClient.get<{ costoPromedio: number }>(
        `${BASE_URL}/costo-promedio`,
        { params: { invcaruniId: productoId, almacenId } },
      );
      return data.costoPromedio;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Obtener último lote disponible
  async obtenerUltimoLote(params: {
    invcaruniId: number;
    almacenId: number;
    nroDocumento?: string;
  }): Promise<{ ultimoLote: string }> {
    try {
      const { data } = await apiClient.get<{ ultimoLote: string }>(
        `${BASE_URL}/ultimo-lote`,
        { params },
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Actualizar costo de entrada temporal cero
  async actualizarCostoCero(
    movimientoId: number,
    nuevoCosto: number,
  ): Promise<{
    message: string;
    data: {
      movimientoActualizado: number;
      nuevoCosto: number;
      nuevoCostoPromedioPonderado: number;
      salidasActualizadas: number;
    };
  }> {
    try {
      const { data } = await apiClient.patch<{
        message: string;
        data: {
          movimientoActualizado: number;
          nuevoCosto: number;
          nuevoCostoPromedioPonderado: number;
          salidasActualizadas: number;
        };
      }>(`${BASE_URL}/${movimientoId}`, { nuevoCosto });
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

// Funciones utilitarias
export const movementsUtils = {
  // Obtener color del tipo de movimiento
  obtenerColorTipo: (tipo: number): string => {
    switch (tipo) {
      case 1:
        return "text-green-600 bg-green-50"; // Entrada
      case 2:
        return "text-red-600 bg-red-50"; // Salida
      default:
        return "text-gray-600 bg-gray-50";
    }
  },

  // Obtener icono del tipo de movimiento
  obtenerIconoTipo: (tipo: number): string => {
    switch (tipo) {
      case 1:
        return "↗️"; // Entrada
      case 2:
        return "↙️"; // Salida
      default:
        return "↔️";
    }
  },

  // Formatear cantidad
  formatearCantidad: (cantidad: number): string => {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cantidad);
  },
};

export default movementsApi;
