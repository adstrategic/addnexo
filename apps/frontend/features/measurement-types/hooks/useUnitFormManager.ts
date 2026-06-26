"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateUnitDto,
  type UpdateUnitDto,
  createUnitSchema,
} from "../schemas/units.schema";
import { useUnitActions } from "./useUnitActions";
import { useUnitBySequence } from "./useUnits";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseUnitManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useUnitManager(options?: UseUnitManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [unitSequence, setUnitSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  const {
    data: existingUnit,
    isLoading: isLoadingUnit,
    error: unitError,
  } = useUnitBySequence(unitSequence ?? 0, mode === "edit" && !!unitSequence);

  const defaultValues: DefaultValues<CreateUnitDto> = {
    UMNombre: "",
    UMDescripcion: "",
  };

  const form = useForm<CreateUnitDto>({
    resolver: zodResolver(createUnitSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useUnitActions(form.setError);

  const getFormValues = (): CreateUnitDto | undefined => {
    if (mode === "edit" && existingUnit) {
      return {
        UMNombre: existingUnit.UMNombre,
        UMDescripcion: existingUnit.UMDescripcion,
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (mode === "edit" && existingUnit) {
      form.reset(getFormValues());
    }
  }, [existingUnit, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setUnitSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setUnitSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setUnitSequence(null);
  };

  const processFormData = (data: CreateUnitDto) => {
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
        if (!existingUnit) {
          handleMutationError(new Error("No unit data loaded"));
          return;
        }
        actions.handleUpdate(existingUnit.UMId, apiData as UpdateUnitDto, {
          onSuccess: onSuccessCallback,
        });
      } else {
        actions.handleCreate(apiData as CreateUnitDto, {
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
    unit: existingUnit,
    isLoadingUnit,
    unitError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
