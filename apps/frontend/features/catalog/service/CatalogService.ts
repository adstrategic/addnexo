import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { Producto, ProductosResponse } from "../types/server-types";
import type {
  ActualizarProductoData,
  ProductFormData,
} from "../schemas/CatalogSchema";

const BASE_URL = "/catalog";

export type ListProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
  grupoId?: number;
  grupoNro?: number;
  /** Origin country id (Invcaruni.CKOrigenId); filters catalog list server-side. */
  paisId?: number;
  unidadId?: number;
  excludeGrupoNro?: number;
};

async function list(params?: ListProductsParams): Promise<ProductosResponse> {
  try {
    const { data } = await apiClient.get<ProductosResponse>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        grupoId: params?.grupoId,
        grupoNro: params?.grupoNro,
        paisId: params?.paisId,
        unidadMedidaId: params?.unidadId,
        excludeGrupoNro: params?.excludeGrupoNro,
      },
    });
    return data;
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getBySequence(sequence: number): Promise<Producto> {
  try {
    const { data } = await apiClient.get<Producto>(`${BASE_URL}/${sequence}`);
    return data;
  } catch (error) {
    handleApiError(error);
  }
}

async function create(dto: ProductFormData): Promise<Producto> {
  try {
    const { data } = await apiClient.post<Producto>(BASE_URL, dto);
    return data;
  } catch (error) {
    handleApiError(error);
  }
}

async function update(
  id: number,
  dto: ActualizarProductoData,
): Promise<Producto> {
  try {
    const { data } = await apiClient.patch<Producto>(`${BASE_URL}/${id}`, dto);
    return data;
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteProduct(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const productsService = {
  list,
  getBySequence,
  create,
  update,
  delete: deleteProduct,
};

export const productsUtils = {
  formatCodigo: (codigo: number, longitud: number = 5): string =>
    String(codigo).padStart(longitud, "0"),
};
