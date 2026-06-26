import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsService } from "../services/ClientsServices";
import type {
  CreateClientDto,
  UpdateClientDto,
  ClientesResponse,
  ListClientsParams,
} from "../schemas/ClientSchema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

export type { ListClientsParams } from "../schemas/ClientSchema";

export const clientKeys = {
  all: ["clients"] as const,
  lists: () => [...clientKeys.all, "list"] as const,
  list: (params?: Omit<ListClientsParams, "enabled" | "initialData">) =>
    [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, "detail"] as const,
  detail: (id: number) => [...clientKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...clientKeys.details(), "sequence", sequence] as const,
};

export function useClients(
  params?: ListClientsParams & {
    initialData?: ClientesResponse;
    enabled?: boolean;
  },
) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: clientKeys.list(queryParams),
    queryFn: () => clientsService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useClientBySequence(
  sequence: number | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: clientKeys.bySequence(sequence ?? 0),
    queryFn: () => clientsService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateClient(
  setError?: UseFormSetError<CreateClientDto>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientDto) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success("Client created", {
        description: "The client has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateClient(
  setError?: UseFormSetError<CreateClientDto>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClientDto }) =>
      clientsService.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: clientKeys.bySequence(updated.COrgSecuencia),
      });
      toast.success("Client updated", {
        description: "The client has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; sequence: number }) =>
      clientsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.lists() });
      toast.success("Client deleted", {
        description: "The client has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}

