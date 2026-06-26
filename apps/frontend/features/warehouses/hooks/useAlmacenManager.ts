"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateAlmacenDto,
  type UpdateAlmacenDto,
  createAlmacenSchema,
} from "../schemas/almacenes.schema";
import { useAlmacenActions } from "./useAlmacenActions";
import { useAlmacenBySequence } from "./useAlmacenes";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseAlmacenManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useAlmacenManager(options?: UseAlmacenManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [almacenSequence, setAlmacenSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  const {
    data: existingAlmacen,
    isLoading: isLoadingAlmacen,
    error: almacenError,
  } = useAlmacenBySequence(
    almacenSequence ?? 0,
    mode === "edit" && !!almacenSequence,
  );

  const defaultValues: DefaultValues<CreateAlmacenDto> = {
    ALCiudadId: 0,
    ALNombre: "",
    ALResponsable: "",
    ALDireccion: "",
    ALTelefono: "",
  };

  const form = useForm<CreateAlmacenDto>({
    resolver: zodResolver(createAlmacenSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useAlmacenActions(form.setError);

  const getFormValues = (): CreateAlmacenDto | undefined => {
    if (mode === "edit" && existingAlmacen) {
      return {
        ALCiudadId: existingAlmacen.ALCiudadId,
        ALNombre: existingAlmacen.ALNombre,
        ALResponsable: existingAlmacen.ALResponsable,
        ALDireccion: existingAlmacen.ALDireccion,
        ALTelefono: existingAlmacen.ALTelefono,
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (mode === "edit" && existingAlmacen) {
      form.reset(getFormValues());
    }
  }, [existingAlmacen, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setAlmacenSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setAlmacenSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setAlmacenSequence(null);
  };

  const processFormData = (data: CreateAlmacenDto) => {
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
        if (!existingAlmacen) {
          handleMutationError(new Error("No warehouse data loaded"));
          return;
        }
        actions.handleUpdate(
          existingAlmacen.ALId,
          apiData as UpdateAlmacenDto,
          {
            onSuccess: onSuccessCallback,
          },
        );
      } else {
        actions.handleCreate(apiData as CreateAlmacenDto, {
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
    almacen: existingAlmacen,
    isLoadingAlmacen,
    almacenError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
