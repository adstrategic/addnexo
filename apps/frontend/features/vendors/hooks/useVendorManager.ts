"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createVendorSchema,
  type CreateVendorDto,
  type UpdateVendorDto,
} from "../schemas/VendorSchema";
import { useVendorActions } from "./useVendorActions";
import { useVendorBySequence } from "./useVendors";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";
import { transformFromApiFormat } from "../lib/utils";

interface UseVendorManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useVendorManager(options?: UseVendorManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(options?.mode ?? "create");
  const [vendorSequence, setVendorSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null ? options.sequence : null,
  );

  const {
    data: existingVendor,
    isLoading: isLoadingVendor,
    error: vendorError,
  } = useVendorBySequence(vendorSequence ?? 0, mode === "edit" && !!vendorSequence);

  const defaultValues: DefaultValues<CreateVendorDto> = {
    VNombre: "",
    VCorreo: "",
    VTelefono: "",
    VNitCedula: "",
  };

  const form = useForm<CreateVendorDto>({
    resolver: zodResolver(createVendorSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  const actions = useVendorActions(form.setError);

  useEffect(() => {
    if (mode === "edit" && existingVendor) {
      form.reset(transformFromApiFormat(existingVendor));
    }
  }, [existingVendor, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setVendorSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setVendorSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setVendorSequence(null);
  };

  const processFormData = (data: CreateVendorDto) => {
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "edit") {
        if (!existingVendor) {
          handleMutationError(new Error("No vendor data loaded"));
          return;
        }
        actions.handleUpdate(existingVendor.VId, apiData as UpdateVendorDto, {
          onSuccess: onSuccessCallback,
        });
      } else {
        actions.handleCreate(apiData as CreateVendorDto, {
          onSuccess: onSuccessCallback,
        });
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
    vendor: existingVendor,
    isLoadingVendor,
    vendorError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
