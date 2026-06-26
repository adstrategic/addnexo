import type { UseFormSetError } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { banksService } from "../services/BanksServices";
import type {
  BanksResponse,
  CreateBankDto,
  UpdateBankDto,
  ListBanksParams,
} from "../schemas/BankSchema";
import { toast } from "sonner";
import { handleMutationError } from "@/lib/errors/handle-error";

export type { ListBanksParams } from "../schemas/BankSchema";

/**
 * Query key factory for bank queries
 */
export const bankKeys = {
  all: ["banks"] as const,
  lists: () => [...bankKeys.all, "list"] as const,
  list: (params?: Omit<ListBanksParams, "enabled" | "initialData">) =>
    [...bankKeys.lists(), params] as const,
  details: () => [...bankKeys.all, "detail"] as const,
  detail: (id: number) => [...bankKeys.details(), id] as const,
  bySequence: (sequence: number) =>
    [...bankKeys.details(), "sequence", sequence] as const,
};

export function useBanks(
  params?: ListBanksParams & {
    initialData?: BanksResponse;
    enabled?: boolean;
  },
) {
  const { enabled = true, initialData, ...queryParams } = params ?? {};

  return useQuery({
    queryKey: bankKeys.list(queryParams),
    queryFn: () => banksService.list(queryParams),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
    enabled,
    initialData,
  });
}

export function useBankBySequence(sequence: number | null, enabled: boolean) {
  return useQuery({
    queryKey: bankKeys.bySequence(sequence ?? 0),
    queryFn: () => banksService.getBySequence(sequence!),
    enabled: enabled && sequence != null,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateBank(setError?: UseFormSetError<CreateBankDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBankDto) => banksService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankKeys.lists() });
      toast.success("Bank created", {
        description: "The bank has been added successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useUpdateBank(setError?: UseFormSetError<CreateBankDto>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sequence,
      data,
    }: {
      sequence: number;
      data: UpdateBankDto;
    }) => banksService.update(sequence, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: bankKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bankKeys.bySequence(updated.BOrgSecuencia),
      });
      toast.success("Bank updated", {
        description: "The bank has been updated successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err, setError);
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sequence: number) => banksService.delete(sequence),
    onSuccess: (_, sequence) => {
      queryClient.invalidateQueries({ queryKey: bankKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: bankKeys.bySequence(sequence),
      });
      toast.success("Bank deleted", {
        description: "The bank has been deleted successfully.",
      });
    },
    onError: (err) => {
      handleMutationError(err);
    },
  });
}
