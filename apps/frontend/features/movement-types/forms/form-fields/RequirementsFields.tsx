"use client";

import { Control, Controller, useWatch } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { MovementTypeFormData } from "../../schemas/movement-type-schema";

interface RequirementsFieldsProps {
  control: Control<MovementTypeFormData>;
  isLoading?: boolean;
}

export function RequirementsFields({
  control,
  isLoading = false,
}: RequirementsFieldsProps) {
  // Watch TPedido and TRequiere to implement mutual exclusion
  const tPedido = useWatch({ control, name: "TPedido" });
  const tRequiere = useWatch({ control, name: "TRequiere" });
  // Inventory adjustments are exclusive: all requirement flags are forced off
  const tAjusteInventario = useWatch({ control, name: "TAjusteInventario" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Requires Client Purchase Order */}
        <Controller
          control={control}
          name="TPedido"
          render={({ field, fieldState }) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FieldContent>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || tRequiere || tAjusteInventario}
                />
              </FieldContent>
              <div className="space-y-1 leading-none">
                <FieldLabel>Requires Client Purchase Order</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Requires Invoice */}
        <Controller
          control={control}
          name="TFactura"
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
                <FieldLabel>Requires Invoice</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Requires Supplier */}
        <Controller
          control={control}
          name="TProv"
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
                <FieldLabel>Requires Supplier</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Requires Customer */}
        <Controller
          control={control}
          name="TCliente"
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
                <FieldLabel>Requires Customer</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Requires Supplier Purchase Order */}
        <Controller
          control={control}
          name="TRequiere"
          render={({ field, fieldState }) => (
            <Field className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FieldContent>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading || tPedido || tAjusteInventario}
                />
              </FieldContent>
              <div className="space-y-1 leading-none">
                <FieldLabel>Requires Supplier Purchase Order</FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
