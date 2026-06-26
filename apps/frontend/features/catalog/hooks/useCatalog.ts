import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";
import { productsService } from "../service/CatalogService";
import type { ProductosResponse } from "../types/server-types";
import type { ListProductsParams } from "../service/CatalogService";
import type {
  ActualizarProductoData,
  ProductFormData,
} from "../schemas/CatalogSchema";

type UseProductsParams = ListProductsParams & {
  enabled?: boolean;
  initialData?: ProductosResponse;
};

/**
 * Query key factory for product queries
 */
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params?: ListProductsParams) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  bySequence: (sequence: number) =>
    [...productKeys.details(), "sequence", sequence] as const,
};

export function useProducts(params?: UseProductsParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: productKeys.list(queryParams),
    queryFn: () => productsService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useProduct(secuencia: number | null, enabled = true) {
  return useQuery({
    queryKey: productKeys.bySequence(secuencia ?? 0),
    queryFn: () => productsService.getBySequence(secuencia!),
    enabled: enabled && secuencia != null && secuencia > 0,
    staleTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCrearProducto(setError?: UseFormSetError<ProductFormData>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormData) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product created", {
        description: "The product has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useActualizarProducto(
  setError?: UseFormSetError<ProductFormData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActualizarProductoData }) =>
      productsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.bySequence(data.CKOrgSecuencia),
      });
      toast.success("Product updated", {
        description: "The product has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useEliminarProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Product deleted", {
        description: "The product has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}
