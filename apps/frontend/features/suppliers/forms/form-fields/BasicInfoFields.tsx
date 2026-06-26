"use client";

import { Control, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { CreateSupplierDTO } from "../../schemas/SupplierSchemas";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface BasicInfoFieldsProps {
  control: Control<CreateSupplierDTO>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function BasicInfoFields({
  control,
  isLoading = false,
}: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Description */}
        <Controller
          control={control}
          name="MPDescripcion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Description *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ej: Distribuidora Nacional S.A.S"
                  disabled={isLoading}
                  maxLength={40}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Responsible */}
        <Controller
          control={control}
          name="MPResponsable"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Responsible *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ej: Carlos Rodríguez"
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Address */}
        <Controller
          control={control}
          name="MPDireccion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Address *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ex: 123 Main St"
                  disabled={isLoading}
                  {...field}
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
