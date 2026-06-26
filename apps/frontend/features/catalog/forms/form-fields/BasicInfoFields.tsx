"use client";

import { Control, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { GroupSelector } from "../../selectors/GroupSelector";
import { UnitSelector } from "../../selectors/UnitSelector";
import { PaisSelector } from "@/components/shared/selectors/PaisSelector";
import { ProductFormData } from "../../schemas/CatalogSchema";
import type { Producto } from "../../types/server-types";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type { PaisOption } from "@/features/geography";

interface BasicInfoFieldsProps {
  control: Control<ProductFormData>;
  isLoading?: boolean;
  mode: "create" | "edit";
  initialData?: Producto;
}

function initialPaisFromProduct(product?: Producto): PaisOption | null {
  if (!product?.origenPais) return null;
  return {
    id: product.origenPais.id,
    nombre: product.origenPais.nombre,
    codigo: product.origenPais.codigo,
  };
}

export function BasicInfoFields({
  control,
  isLoading = false,
  mode,
  initialData,
}: BasicInfoFieldsProps) {
  const initialPais = initialPaisFromProduct(initialData);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          control={control}
          name="CKGrupoId"
          render={({ field }) => (
            <GroupSelector
              field={field}
              initialGroup={initialData?.grupo || null}
              disabled={mode === "edit" || isLoading}
            />
          )}
        />

        <Controller
          control={control}
          name="CKUnidadMedidaId"
          render={({ field }) => (
            <UnitSelector
              field={field}
              initialUnit={initialData?.unidadDeMedida || null}
              disabled={mode === "edit" || isLoading}
            />
          )}
        />

        <Controller
          control={control}
          name="CKDescripcion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Description *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ex: Premium Cleaning Product"
                  disabled={isLoading}
                  maxLength={40}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={control}
          name="CKOrigenId"
          render={({ field, fieldState }) => (
            <div>
              <PaisSelector
                field={{
                  value: field.value,
                  onChange: field.onChange,
                }}
                initialPais={initialPais}
                disabled={isLoading}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </div>
          )}
        />

        <Controller
          control={control}
          name="CKPesoPromedioKg"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Average weight (kg) *</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  disabled={isLoading}
                  {...field}
                  value={field.value === undefined ? "" : field.value}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? 0 : Number(v));
                  }}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
