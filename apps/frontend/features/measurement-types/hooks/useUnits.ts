import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { unitsService } from "../service/units.service";
import type {
  CreateUnitDto,
  UpdateUnitDto,
  UnitResponseList,
} from "../schemas/units.schema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

type ListUnitsParams = {
  page?: number;
  search?: string;
  limit?: number;
  enabled?: boolean;
  initialData?: UnitResponseList;
};

/**
 * Query key factory for unit queries
 */
export const unitKeys = {
  all: ["units"] as const,
  lists: () => [...unitKeys.all, "list"] as const,
  list: (params?: ListUnitsParams) => [...unitKeys.lists(), params] as const,
  details: () => [...unitKeys.all, "detail"] as const,
  detail: (id: number) => [...unitKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...unitKeys.details(), "sequence", sequence] as const,
};

export function useUnits(params?: ListUnitsParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: unitKeys.list(queryParams),
    queryFn: () => unitsService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useUnitBySequence(sequence: number | null, enabled: boolean) {
  return useQuery({
    queryKey: unitKeys.bySequence(sequence ?? 0),
    queryFn: () => unitsService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateUnit(setError?: UseFormSetError<CreateUnitDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUnitDto) => unitsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
      toast.success("Unit created", {
        description: "The unit has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateUnit(setError?: UseFormSetError<CreateUnitDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnitDto }) =>
      unitsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: unitKeys.detail(data.UMId),
      });
      queryClient.invalidateQueries({
        queryKey: unitKeys.bySequence(data.UMOrgSecuencia),
      });
      toast.success("Unit updated", {
        description: "The unit has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; sequence: number }) =>
      unitsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unitKeys.lists() });
      toast.success("Unit deleted", {
        description: "The unit has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}

/**
 * Products by unit - stub until backend endpoint is available.
 */
export function useProductsByUnit(
  _unitId: number,
  _params?: { page?: number; search?: string },
) {
  return useQuery({
    queryKey: [...unitKeys.all, "products", _unitId, _params],
    queryFn: async () => ({
      data: [] as unknown[],
      pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 },
    }),
    enabled: false,
  });
}
