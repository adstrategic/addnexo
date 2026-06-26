import type { UseFormSetError } from "react-hook-form";
// React Query
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import {
  type CreateVendorDto,
  type ListVendorsParams,
  type UpdateVendorDto,
  type VendorResponseList,
} from "../schemas/VendorSchema";
import { vendorsService } from "../services/VendorServices";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  list: (params: ListVendorsParams) => [...vendorKeys.lists(), params] as const,
  details: () => [...vendorKeys.all, "detail"] as const,
  detail: (sequence: number) => [...vendorKeys.details(), sequence] as const,
  bySequence: (sequence: number) =>
    [...vendorKeys.details(), "sequence", sequence] as const,
};

interface UseVendorsOptions extends ListVendorsParams {
  enabled?: boolean;
  initialData?: VendorResponseList;
}

export function useVendors(params?: UseVendorsOptions) {
  const { enabled = true, initialData, ...queryParams } = params || {};

  return useQuery({
    queryKey: vendorKeys.list(queryParams),
    queryFn: () => vendorsService.list(queryParams),
    enabled,
    initialData,
    placeholderData: keepPreviousData,
  });
}

export function useVendorBySequence(sequence: number, enabled: boolean = true) {
  return useQuery({
    queryKey: vendorKeys.bySequence(sequence),
    queryFn: () => vendorsService.getBySequence(sequence),
    enabled: enabled && !!sequence,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateVendor(setError?: UseFormSetError<CreateVendorDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVendorDto) => vendorsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success("Vendor created", {
        description: "The vendor has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateVendor(setError?: UseFormSetError<CreateVendorDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVendorDto }) =>
      vendorsService.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: vendorKeys.bySequence(updated.VOrgSecuencia),
      });
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success("Vendor updated", {
        description: "The vendor has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => vendorsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
      toast.success("Vendor deleted", {
        description: "The vendor has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}
