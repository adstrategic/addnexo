import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsService } from "../service/groups.service";
import type {
  CreateGroupDto,
  UpdateGroupDto,
  GroupResponseList,
} from "../schemas/groups.schema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

type ListGroupsParams = {
  page?: number;
  search?: string;
  limit?: number;
  enabled?: boolean;
  initialData?: GroupResponseList;
};

/**
 * Query key factory for group queries
 */
export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: (params?: ListGroupsParams) => [...groupKeys.lists(), params] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (id: number) => [...groupKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...groupKeys.details(), "sequence", sequence] as const,
};

export function useGroups(params?: ListGroupsParams) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: groupKeys.list(queryParams),
    queryFn: () => groupsService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useGroupBySequence(sequence: number | null, enabled: boolean) {
  return useQuery({
    queryKey: groupKeys.bySequence(sequence ?? 0),
    queryFn: () => groupsService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateGroup(setError?: UseFormSetError<CreateGroupDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGroupDto) => groupsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      toast.success("Group created", {
        description: "The group has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateGroup(setError?: UseFormSetError<CreateGroupDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGroupDto }) =>
      groupsService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: groupKeys.detail(data.GId),
      });
      queryClient.invalidateQueries({
        queryKey: groupKeys.bySequence(data.GOrgSecuencia),
      });
      toast.success("Group updated", {
        description: "The group has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; sequence: number }) =>
      groupsService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });

      queryClient.invalidateQueries({
        queryKey: groupKeys.detail(variables.sequence),
      });

      toast.success("Group deleted", {
        description: "The group has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}

/**
 * Products by group - stub until backend endpoint is available.
 */
export function useProductsByGroup(
  _groupId: number,
  _params?: { page?: number; search?: string },
) {
  return useQuery({
    queryKey: [...groupKeys.all, "products", _groupId, _params],
    queryFn: async () => ({
      data: [] as unknown[],
      pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 },
    }),
    enabled: false,
  });
}
