import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersService } from "../services/SupplierServices";
import type {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierResponse,
  SupplierResponseList,
} from "../schemas/SupplierSchemas";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

export type ListSuppliersParams = {
  page?: number;
  search?: string;
  limit?: number;
  enabled?: boolean;
  initialData?: SupplierResponseList;
};

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (params?: Omit<ListSuppliersParams, "enabled" | "initialData">) =>
    [...supplierKeys.lists(), params] as const,
  details: () => [...supplierKeys.all, "detail"] as const,
  detail: (id: number) => [...supplierKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...supplierKeys.details(), "sequence", sequence] as const,
};

export function useSuppliers(params?: ListSuppliersParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: supplierKeys.list(queryParams),
    queryFn: () => suppliersService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useSupplierBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: supplierKeys.bySequence(sequence ?? 0),
    queryFn: () => suppliersService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateSupplier(
  setError?: UseFormSetError<CreateSupplierDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierDTO) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast.success("Supplier created", {
        description: "The supplier has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateSupplier(
  setError?: UseFormSetError<CreateSupplierDTO>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSupplierDTO }) =>
      suppliersService.update(id, data),
    onSuccess: (data: SupplierResponse) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(data.MPId),
      });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.bySequence(data.MPOrgSecuencia),
      });
      toast.success("Supplier updated", {
        description: "The supplier has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; sequence: number }) =>
      suppliersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast.success("Supplier deleted", {
        description: "The supplier has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}
