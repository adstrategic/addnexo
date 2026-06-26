"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateSupplierDTO,
  type UpdateSupplierDTO,
  supplierFormSchema,
} from "../schemas/SupplierSchemas";
import { useSupplierActions } from "./useSupplierActions";
import { useSupplierBySequence } from "./useSuppliers";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseSupplierFormManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useSupplierFormManager(
  options?: UseSupplierFormManagerOptions,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [supplierSequence, setSupplierSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  const {
    data: existingSupplier,
    isLoading: isLoadingSupplier,
    error: supplierError,
  } = useSupplierBySequence(
    supplierSequence ?? 0,
    mode === "edit" && !!supplierSequence,
  );

  const defaultValues: DefaultValues<CreateSupplierDTO> = {
    MPDescripcion: "",
    MPResponsable: "",
    MPDireccion: "",
    MPCiudadId: 0,
    MPTelefono1: "",
    MPTelefono2: null,
    MPCorreo1: "",
    MPCorreo2: null,
    MPNro: "",
    MPRetencion: "NO",
  };

  const form = useForm<CreateSupplierDTO>({
    resolver: zodResolver(supplierFormSchema) as Resolver<CreateSupplierDTO>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  const actions = useSupplierActions(form.setError);

  const getFormValues = (): CreateSupplierDTO | undefined => {
    if (mode === "edit" && existingSupplier) {
      return {
        MPDescripcion: existingSupplier.MPDescripcion,
        MPResponsable: existingSupplier.MPResponsable,
        MPDireccion: existingSupplier.MPDireccion,
        MPCiudadId: existingSupplier.ciudad.id,
        MPTelefono1: existingSupplier.MPTelefono1,
        MPTelefono2: existingSupplier.MPTelefono2 ?? null,
        MPCorreo1: existingSupplier.MPCorreo1,
        MPCorreo2: existingSupplier.MPCorreo2 ?? null,
        MPNro: existingSupplier.MPNro,
        MPRetencion: (existingSupplier.MPRetencion as "SI" | "NO") || "NO",
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (mode === "edit" && existingSupplier) {
      form.reset(getFormValues());
    }
  }, [existingSupplier, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setSupplierSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setSupplierSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSupplierSequence(null);
  };

  const processFormData = (data: CreateSupplierDTO) => {
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
        if (!existingSupplier) {
          handleMutationError(new Error("No supplier data loaded"));
          return;
        }
        actions.handleUpdate(
          existingSupplier.MPId,
          apiData as UpdateSupplierDTO,
          {
            onSuccess: onSuccessCallback,
          },
        );
      } else {
        actions.handleCreate(apiData as CreateSupplierDTO, {
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
    supplier: existingSupplier,
    isLoadingSupplier,
    supplierError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
