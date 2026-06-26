import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { almacenesService } from "../services/almacenes.services";
import type {
  CreateAlmacenDto,
  UpdateAlmacenDto,
  AlmacenResponseList,
} from "../schemas/almacenes.schema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

type ListAlmacenesParams = {
  page?: number;
  search?: string;
  limit?: number;
  enabled?: boolean;
  initialData?: AlmacenResponseList;
};

/**
 * Query key factory for almacen (warehouse) queries
 */
export const almacenKeys = {
  all: ["almacenes"] as const,
  lists: () => [...almacenKeys.all, "list"] as const,
  list: (params?: ListAlmacenesParams) =>
    [...almacenKeys.lists(), params] as const,
  details: () => [...almacenKeys.all, "detail"] as const,
  detail: (id: number) => [...almacenKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...almacenKeys.details(), "sequence", sequence] as const,
};

export function useAlmacenes(params?: ListAlmacenesParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: almacenKeys.list(queryParams),
    queryFn: () => almacenesService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useAlmacenBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: almacenKeys.bySequence(sequence ?? 0),
    queryFn: () => almacenesService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateAlmacen(setError?: UseFormSetError<CreateAlmacenDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAlmacenDto) => almacenesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenKeys.lists() });
      toast.success("Warehouse created", {
        description: "The warehouse has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateAlmacen(setError?: UseFormSetError<CreateAlmacenDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAlmacenDto }) =>
      almacenesService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: almacenKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: almacenKeys.detail(data.ALId),
      });
      queryClient.invalidateQueries({
        queryKey: almacenKeys.bySequence(data.ALOrgSecuencia),
      });
      toast.success("Warehouse updated", {
        description: "The warehouse has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteAlmacen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; sequence: number }) =>
      almacenesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: almacenKeys.lists() });
      toast.success("Warehouse deleted", {
        description: "The warehouse has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}
