"use client";

import { useEffect, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  movementTypeFormSchema,
  type MovementTypeFormData,
  type ActualizarMovementTypeData,
  transformFromApiFormat,
} from "../schemas/movement-type-schema";
import { useMovementTypeActions } from "./useMovementTypeActions";
import { useMovementType } from "./useMovementTypes";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseMovementTypeManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useMovementTypeManager(options?: UseMovementTypeManagerOptions) {
  // === ESTADO UI ===
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [movementTypeSequence, setMovementTypeSequence] = useState<
    number | null
  >(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  // === DATA FETCHING ===
  const {
    data: existingMovementType,
    isLoading: isLoadingMovementType,
    error: movementTypeError,
  } = useMovementType(
    movementTypeSequence ?? 0,
    mode === "edit" && !!movementTypeSequence,
  );

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: MovementTypeFormData = {
    TTipo: 1,
    TClase: 0,
    TDescripcion: "",
    TAbreviatura: "",
    TAfecta: true,
    TPedido: false,
    TFactura: false,
    TProv: false,
    TCliente: false,
    TRequiere: false,
    TRecalcular: false,
    TAjusteInventario: false,
    TProposito: undefined,
  };

  const form = useForm<MovementTypeFormData>({
    resolver: zodResolver(movementTypeFormSchema) as Resolver<MovementTypeFormData>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // === ACCIONES ===
  const actions = useMovementTypeActions(form.setError);

  // Add this useEffect after the form declaration
  useEffect(() => {
    if (mode === "edit" && existingMovementType) {
      form.reset(transformFromApiFormat(existingMovementType));
    }
  }, [existingMovementType, mode, form]);

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = () => {
    setMode("create");
    setMovementTypeSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setMovementTypeSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setMovementTypeSequence(null);
  };

  // Envío del formulario
  const processFormData = (data: MovementTypeFormData) => {
    // En modo edición, solo enviamos campos modificados
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
        if (!existingMovementType) {
          handleMutationError(new Error("No movement type data loaded"));
          return;
        }

        actions.handleUpdate(
          existingMovementType.TId,
          apiData as ActualizarMovementTypeData,
          {
            onSuccess: onSuccessCallback,
          },
        );
      } else {
        actions.handleCreate(apiData as MovementTypeFormData, {
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
    // Modal Formulario
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,

    // Datos del tipo de movimiento
    movementType: existingMovementType,
    isLoadingMovementType,
    movementTypeError,

    // Formulario
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
