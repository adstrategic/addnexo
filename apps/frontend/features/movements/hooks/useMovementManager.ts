"use client";

import { useState } from "react";
import { DefaultValues, Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMovementFormSchema,
  type MovementFormData,
  type MovementFormDataSingle,
} from "../schemas/movement-form-schema";
import { useMovementActions } from "./useMovementActions";
import { handleMutationError } from "@/lib/errors/handle-error";
import { useFormScroll } from "@/hooks/useFormScroll";
import { useMovementTypes } from "@/features/movement-types";
import { startOfDay } from "date-fns";
import { usePeriod } from "@/lib/context/period-context";

interface UseMovementManagerOptions {
  onAfterSubmit?: () => void;
}

function getDefaultMovementDate(mes: number, ano: number): Date {
  const today = new Date();
  const periodYear = ano >= 100 ? ano : 2000 + ano;
  const isCurrentMonth =
    mes === today.getMonth() + 1 && periodYear === today.getFullYear();
  if (isCurrentMonth) {
    return startOfDay(today);
  }
  return startOfDay(new Date(periodYear, mes - 1, 1));
}

export function useMovementManager(options?: UseMovementManagerOptions) {
  const { mes, ano, closed } = usePeriod();

  // === ESTADO UI ===
  const [isOpen, setIsOpen] = useState(false);

  // === ACCIONES ===
  const actions = useMovementActions();
  const { data: tiposMovimiento, isLoading: isLoadingTiposMovimiento } =
    useMovementTypes();

  // === CONFIGURACIÓN DEL FORMULARIO ===
  const defaultValues: DefaultValues<MovementFormData> = {
    grupoNro: undefined,
    modoSalida: "automatico",
    MVFecha: getDefaultMovementDate(mes, ano),
    MVClienteId: undefined,
    MVProveedorId: undefined,
    MVLote: undefined,
    MVDescuento: 0,
    MVImpuesto: 0,
    lineas: [
      {
        invcaruniId: 0,
        MVCantidad: 0,
        MVCostoPrecio: 0,
        MVLote: undefined,
        MVLoteNroDocumento: undefined,
      },
    ],
  };

  // Crear schema dinámicamente con validaciones condicionales.
  // mes/ano scope MVFecha to the active period (see usePeriod above).
  const schema = tiposMovimiento?.data
    ? createMovementFormSchema(tiposMovimiento.data, mes, ano)
    : createMovementFormSchema([], mes, ano);

  const form = useForm<MovementFormData>({
    resolver: zodResolver(schema) as Resolver<MovementFormData>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  const { scrollToField } = useFormScroll();

  // === HANDLERS ===

  // Abrir modal en modo Crear
  const openCreate = () => {
    if (closed) {
      return;
    }
    form.reset({
      ...defaultValues,
      MVFecha: getDefaultMovementDate(mes, ano),
    });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  // Envío del formulario: build one full movement DTO per line and call bulk once
  const onSubmit = form.handleSubmit(
    async (data) => {
      try {
        const lineasForm = data.lineas ?? [];
        const tipoMovimientoSeleccionado = tiposMovimiento?.data?.find(
          (tipo) => tipo.TId === data.MVTipoMovimientoId,
        );
        const esEntrada = tipoMovimientoSeleccionado?.TTipo === 1;
        const lineas: MovementFormDataSingle[] = lineasForm.map((linea) => {
          const isManualExit = data.modoSalida === "manual";
          const useSingleLot =
            isManualExit &&
            Boolean(linea.MVLote?.trim()) &&
            typeof linea.MVLoteNroDocumento === "string" &&
            linea.MVLoteNroDocumento.trim().length > 0;
          return {
            MVTipoMovimientoId: data.MVTipoMovimientoId,
            almacenId: data.almacenId,
            ciudadId: data.ciudadId,
            MVProveedorId: data.MVProveedorId,
            MVClienteId: data.MVClienteId,
            MVFecha: data.MVFecha,
            MVNroDocumento: data.MVNroDocumento,
            MVEsCostoTemporalCero: data.MVEsCostoTemporalCero ?? false,
            modoSalida: data.modoSalida ?? "automatico",
            MVDescuento: data.MVDescuento ?? 0,
            MVImpuesto: data.MVImpuesto ?? 0,
            invcaruniId: linea.invcaruniId,
            MVCantidad: linea.MVCantidad,
            MVCostoPrecio: linea.MVCostoPrecio,
            MVLote: esEntrada ? data.MVLote : linea.MVLote,
            MVLoteNroDocumento: esEntrada
              ? data.MVNroDocumento
              : linea.MVLoteNroDocumento,
            lotesManual: useSingleLot ? undefined : linea.lotesManual,
          };
        });

        await actions.handleCrearMovimientosBulk({ lineas });

        close();
        options?.onAfterSubmit?.();
      } catch (error) {
        handleMutationError(error);
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
    openCreate,
    close,

    // Formulario
    form,
    onSubmit,
    isMutating: actions.isCreating,

    // Estados de tipos de movimiento
    isLoadingTiposMovimiento,
    hasTiposMovimiento:
      tiposMovimiento?.data && tiposMovimiento.data.length > 0,
    tiposMovimiento: tiposMovimiento?.data,
  };
}
