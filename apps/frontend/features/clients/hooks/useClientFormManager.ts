"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clientFormSchema,
  type ClientFormData,
  type UpdateClientDto,
} from "../schemas/ClientSchema";
import { useClientActions } from "./useClientActions";
import { useClientBySequence } from "./useClients";

import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";
import { startOfDay } from "date-fns";

interface UseClientManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useClientManager(options?: UseClientManagerOptions) {
  // === ESTADO UI ===
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [clientSequence, setClientSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: DefaultValues<ClientFormData> = {
    CNitCedula: "",
    CRazonSocial: "",
    CNombreCliente: "",
    CDireccion: "",
    CTelefono1: "",
    CTelefono2: null,
    CCorreo1: "",
    CCorreo2: null,
    CCiudadId: 0,
    CVendedorVId: 0,
    CDiasParaVencerFactura: 30,
    CRecordatorioPostVencido: 5,
    CCupoAutorizado: 0,
    CAbonos: 0,
    CFechaIngreso: startOfDay(new Date()),
  };

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema) as Resolver<ClientFormData>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // === DATA FETCHING ===
  const {
    data: existingClient,
    isLoading: isLoadingClient,
    error: clientError,
  } = useClientBySequence(
    clientSequence ?? 0,
    mode === "edit" && !!clientSequence,
  );

  // === ACCIONES ===
  const actions = useClientActions(form.setError);

  useEffect(() => {
    if (mode === "edit" && existingClient) {
      form.reset({
        CNitCedula: existingClient.CNitCedula,
        CRazonSocial: existingClient.CRazonSocial,
        CNombreCliente: existingClient.CNombreCliente,
        CDireccion: existingClient.CDireccion,
        CTelefono1: existingClient.CTelefono1,
        CTelefono2: existingClient.CTelefono2,
        CCorreo1: existingClient.CCorreo1,
        CCorreo2: existingClient.CCorreo2,
        CCiudadId: existingClient.CCiudadId,
        CVendedorVId: existingClient.CVendedorVId,
        CDiasParaVencerFactura: existingClient.CDiasParaVencerFactura,
        CRecordatorioPostVencido: existingClient.CRecordatorioPostVencido,
        CCupoAutorizado: existingClient.CCupoAutorizado,
        CAbonos: existingClient.CAbonos,
        CFechaIngreso: new Date(existingClient.CFechaIngreso),
      });
    }
  }, [existingClient, mode, form]);

  // Hooks de utilidad para el formulario
  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = () => {
    setMode("create");
    setClientSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  // Abrir modal en modo Editar
  const openEdit = (sequence: number) => {
    setMode("edit");
    setClientSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setClientSequence(null);
  };

  // Envío del formulario
  const processFormData = (data: ClientFormData) => {
    // En modo edición, solo enviamos campos modificados
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      const onSuccessCallback = () => {
        close();
        options?.onAfterSubmit?.();
      };

      if (mode === "edit") {
        if (!existingClient) {
          handleMutationError(new Error("No client data loaded"));
          return;
        }

        actions.handleUpdate(existingClient.CId, apiData as UpdateClientDto, {
          onSuccess: onSuccessCallback,
        });
      } else {
        actions.handleCreate(apiData as ClientFormData, {
          onSuccess: onSuccessCallback,
        });
      }
    },
    (errors) => {
      console.error(errors);
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

    // Datos del cliente
    client: existingClient,
    isLoadingClient,
    clientError,

    // Formulario
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
