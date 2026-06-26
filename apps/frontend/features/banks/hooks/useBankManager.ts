"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateBankDto,
  type UpdateBankDto,
  createBankSchema,
} from "../schemas/BankSchema";
import { useBankActions } from "./useBankActions";
import { useBankBySequence } from "./useBanks";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseBankManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useBankManager(options?: UseBankManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [bankSequence, setBankSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  const {
    data: existingBank,
    isLoading: isLoadingBank,
    error: bankError,
  } = useBankBySequence(bankSequence ?? 0, mode === "edit" && !!bankSequence);

  const defaultValues: DefaultValues<CreateBankDto> = {
    BNombre: "",
  };

  const form = useForm<CreateBankDto>({
    resolver: zodResolver(createBankSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useBankActions(form.setError);

  useEffect(() => {
    if (mode === "edit" && existingBank) {
      form.reset({ BNombre: existingBank.BNombre });
    }
  }, [existingBank, mode, form]);

  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setBankSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setBankSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setBankSequence(null);
  };

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      if (mode === "edit") {
        if (!existingBank) {
          handleMutationError(new Error("No bank data loaded"));
          return;
        }
        actions.handleUpdate(
          existingBank.BOrgSecuencia,
          data as UpdateBankDto,
          { onSuccess: onSuccessCallback },
        );
      } else {
        actions.handleCreate(data, { onSuccess: onSuccessCallback });
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

  return {
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,
    bank: existingBank,
    isLoadingBank,
    bankError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
