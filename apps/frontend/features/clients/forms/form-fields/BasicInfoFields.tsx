"use client";

import { Control, Controller } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";
import { ClientFormData } from "../../schemas/ClientSchema";

interface BasicInfoFieldsProps {
  control: Control<ClientFormData>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function BasicInfoFields({
  control,
  isLoading = false,
  mode,
}: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIT/Cedula */}
        <Controller
          control={control}
          name="CNitCedula"
          disabled={mode === "edit"}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>NIT/ID *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Enter NIT or ID number..."
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Razón Social */}
        <Controller
          control={control}
          name="CRazonSocial"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Business Name *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Enter business name..."
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Nombre Cliente */}
        <Controller
          control={control}
          name="CNombreCliente"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Client Name *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Enter client name..."
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Dirección */}
        <Controller
          control={control}
          name="CDireccion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Address *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Enter address..."
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
