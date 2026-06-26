"use client";

import {
  Control,
  Controller,
  useWatch,
  type UseFormSetValue,
} from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovementTypeFormData } from "../../schemas/movement-type-schema";
import { TipoPropositoMovkar } from "../../types/server-types";
import { usePropositosDisponibles } from "../../hooks/useMovementTypes";
import { formatPurpose } from "../../lib/utils";

interface ConfigurationFieldsProps {
  control: Control<MovementTypeFormData>;
  setValue: UseFormSetValue<MovementTypeFormData>;
  isLoading?: boolean;
  mode: "create" | "edit";
  existingPurpose?: TipoPropositoMovkar | null;
  movementTypeId?: number;
}

export function ConfigurationFields({
  control,
  setValue,
  isLoading = false,
  mode,
  existingPurpose,
  movementTypeId,
}: ConfigurationFieldsProps) {
  // An inventory adjustment is exclusive: it forces TAfecta on and every other flag off
  const tAjusteInventario = useWatch({ control, name: "TAjusteInventario" });
  const { data: availablePurposes, isLoading: isLoadingPurposes } =
    usePropositosDisponibles(
      mode === "edit" && movementTypeId ? movementTypeId : undefined,
    );

  const canEditPurpose =
    mode === "create" ||
    existingPurpose === null ||
    existingPurpose === undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Affects Inventory */}
        <Controller
          control={control}
          name="TAfecta"
          render={({ field, fieldState }) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FieldContent>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || tAjusteInventario}
                />
              </FieldContent>
              <div className="space-y-1 leading-none">
                <FieldLabel>Affects Inventory</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Requires Recalculation */}
        <Controller
          control={control}
          name="TRecalcular"
          render={({ field, fieldState }) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FieldContent>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || tAjusteInventario}
                />
              </FieldContent>
              <div className="space-y-1 leading-none">
                <FieldLabel>Requires Recalculation of Average Cost</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Inventory Adjustment */}
        <Controller
          control={control}
          name="TAjusteInventario"
          render={({ field, fieldState }) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FieldContent>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    field.onChange(isChecked);
                    if (isChecked) {
                      // Exclusive flag: adjustments always affect inventory,
                      // disable every other behavior flag, and clear purpose
                      setValue("TAfecta", true, { shouldDirty: true });
                      setValue("TRecalcular", false, { shouldDirty: true });
                      setValue("TPedido", false, { shouldDirty: true });
                      setValue("TFactura", false, { shouldDirty: true });
                      setValue("TProv", false, { shouldDirty: true });
                      setValue("TCliente", false, { shouldDirty: true });
                      setValue("TRequiere", false, { shouldDirty: true });
                      setValue("TProposito", null, { shouldDirty: true });
                    }
                  }}
                  disabled={isLoading}
                />
              </FieldContent>
              <div className="space-y-1 leading-none">
                <FieldLabel>Inventory Adjustment</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Purpose - Show selector when creating or when editing if purpose is null */}
      <div className="space-y-2">
        <Controller
          control={control}
          name="TProposito"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Purpose</FieldLabel>
              {mode === "edit" && !canEditPurpose ? (
                <FieldContent>
                  <div className="flex items-center h-10 px-3 py-2 text-sm border rounded-md bg-muted">
                    {existingPurpose ? (
                      <span className="text-muted-foreground">
                        {formatPurpose(existingPurpose)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        No purpose assigned
                      </span>
                    )}
                  </div>
                </FieldContent>
              ) : (
                <FieldContent>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) =>
                      field.onChange(
                        value === "__NONE__"
                          ? undefined
                          : (value as TipoPropositoMovkar),
                      )
                    }
                    disabled={isLoading || isLoadingPurposes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">None (optional)</SelectItem>
                      {availablePurposes?.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {formatPurpose(purpose)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              {mode === "edit" && !canEditPurpose && (
                <p className="text-xs text-muted-foreground">
                  Purpose cannot be changed after it has been assigned
                </p>
              )}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
