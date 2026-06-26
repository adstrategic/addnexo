"use client";

import { useEffect, useMemo } from "react";
import {
  Control,
  Controller,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { Field, FieldContent, FieldError } from "@/components/ui/field";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { ProductoSelector } from "@/components/shared/selectors/ProductoSelector";
import { LotSelector as SharedLotSelector } from "@/components/shared/selectors/LotSelector";
import { NumericFormat } from "react-number-format";
import type { MovementFormData } from "../schemas/movement-form-schema";
import { useCostoPromedio } from "../hooks/useCostoPromedio";

interface MovementLineRowProps {
  control: Control<MovementFormData>;
  setValue: UseFormSetValue<MovementFormData>;
  index: number;
  almacenId: number | undefined;
  /** Optional catalog group filter (entrada). */
  grupoNro?: number;
  /** Supplier origin country — filters products server-side when set. */
  paisId?: number;
  esCostoTemporalCero: boolean;
  esSalida: boolean;
  /** True when the selected movement type is an inventory adjustment. */
  esAjusteInventario: boolean;
  modoSalida: "automatico" | "manual";
  onRemove: () => void;
  isLoading?: boolean;
}

export function MovementLineRow({
  control,
  setValue,
  index,
  almacenId,
  grupoNro,
  paisId,
  esCostoTemporalCero,
  esSalida,
  esAjusteInventario,
  modoSalida,
  onRemove,
  isLoading = false,
}: MovementLineRowProps) {
  const lineas = useWatch({ control, name: "lineas" });
  const productoId = useWatch({
    control,
    name: `lineas.${index}.invcaruniId`,
  });
  const mvlote = useWatch({
    control,
    name: `lineas.${index}.MVLote`,
  });
  const mvloteNroDocumento = useWatch({
    control,
    name: `lineas.${index}.MVLoteNroDocumento`,
  });

  const excludedLots = useMemo(() => {
    if (!lineas || !productoId || productoId <= 0) return [];
    return lineas
      .filter(
        (l, i) =>
          i !== index &&
          l.invcaruniId === productoId &&
          Boolean(l.MVLote?.trim()) &&
          Boolean(l.MVLoteNroDocumento?.trim()),
      )
      .map((l) => ({
        lote: l.MVLote!.trim(),
        nroDocumento: l.MVLoteNroDocumento!.trim(),
      }));
  }, [lineas, index, productoId]);

  // Adjustment cost: look up the product's current average cost for the active
  // period. When it exists, the backend values the movement from it and no cost
  // input is shown; when it's 0, this is a first-time registration and the user
  // must provide a unit cost.
  const shouldFetchAvgCost =
    esAjusteInventario && (productoId ?? 0) > 0 && (almacenId ?? 0) > 0;

  const { data: costoPromedio = 0, isLoading: isLoadingCosto } =
    useCostoPromedio({
      productoId: shouldFetchAvgCost ? productoId : undefined,
      almacenId: shouldFetchAvgCost ? almacenId : undefined,
    });

  const showAdjustmentCostInput =
    shouldFetchAvgCost && !isLoadingCosto && costoPromedio === 0;

  useEffect(() => {
    if (!esAjusteInventario) return;
    if (!productoId || productoId <= 0 || !almacenId || almacenId <= 0) {
      setValue(`lineas.${index}.MVCostoPrecio`, 0);
      setValue(`lineas.${index}._hasAvgCost`, false);
      return;
    }
    if (isLoadingCosto) return;

    setValue(`lineas.${index}._hasAvgCost`, costoPromedio > 0);
    if (costoPromedio > 0) {
      // Avg cost exists — zero the cost field; the backend uses the avg cost.
      setValue(`lineas.${index}.MVCostoPrecio`, 0);
    }
    // Avg cost = 0 → leave MVCostoPrecio for the user to fill in.
  }, [
    esAjusteInventario,
    productoId,
    almacenId,
    costoPromedio,
    isLoadingCosto,
    index,
    setValue,
  ]);

  const showManualLotSelector = esSalida && modoSalida === "manual";

  const lotStr = mvlote?.trim() ?? "";
  const lotFieldValue =
    lotStr.length > 0 && mvloteNroDocumento?.trim()
      ? { lote: lotStr, nroDocumento: mvloteNroDocumento.trim() }
      : undefined;

  return (
    <TableRow>
      <TableCell>
        <Controller
          control={control}
          name={`lineas.${index}.invcaruniId`}
          render={({ field }) => (
            <ProductoSelector
              field={field}
              initialProduct={null}
              grupoNro={grupoNro}
              paisId={paisId}
            />
          )}
        />
      </TableCell>
      <TableCell>
        <Controller
          control={control}
          name={`lineas.${index}.MVCantidad`}
          render={({ field, fieldState }) => (
            <Field>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  disabled={isLoading}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  customInput={Input}
                  className="w-24"
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </TableCell>
      <TableCell>
        {shouldFetchAvgCost && isLoadingCosto ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : !esAjusteInventario || showAdjustmentCostInput ? (
          <Controller
            control={control}
            name={`lineas.${index}.MVCostoPrecio`}
            render={({ field, fieldState }) => (
              <Field>
                <FieldContent>
                  <NumericFormat
                    value={field.value ?? ""}
                    onValueChange={(values) => {
                      if (!esCostoTemporalCero) {
                        field.onChange(values.floatValue);
                      }
                    }}
                    readOnly={!esSalida && esCostoTemporalCero}
                    disabled={(!esSalida && esCostoTemporalCero) || isLoading}
                    placeholder="0,00"
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    prefix="$"
                    customInput={Input}
                    className="w-32"
                  />
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : null}
      </TableCell>
      {showManualLotSelector && (
        <TableCell colSpan={2}>
          <SharedLotSelector
            field={{
              value: lotFieldValue,
              onChange: (value) => {
                if (value) {
                  setValue(`lineas.${index}.MVLote`, value.lote);
                  setValue(
                    `lineas.${index}.MVLoteNroDocumento`,
                    value.nroDocumento,
                  );
                } else {
                  setValue(`lineas.${index}.MVLote`, undefined);
                  setValue(`lineas.${index}.MVLoteNroDocumento`, undefined);
                }
              },
            }}
            productoId={productoId && productoId > 0 ? productoId : undefined}
            almacenId={almacenId}
            excludedLots={excludedLots}
            disabled={isLoading}
          />
        </TableCell>
      )}
      <TableCell className="w-12">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={isLoading}
          aria-label="Remove line"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
