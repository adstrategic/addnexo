"use client";

// React Hook Form
import { Control, Controller } from "react-hook-form";

// Types
import type { CreateVendorDto } from "../../schemas/VendorSchema";

// UI Components
import { Input } from "@/components/ui/input";

// Phone Input Components
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface BasicInfoFieldsProps {
  control: Control<CreateVendorDto>;
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
          name="VNitCedula"
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

        {/* Nombre Cliente */}
        <Controller
          control={control}
          name="VNombre"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Vendor Name *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Enter vendor name..."
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Teléfono */}
        <Controller
          control={control}
          name="VTelefono"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Primary Phone *</FieldLabel>
              <FieldContent>
                <PhoneInputField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter primary phone..."
                  disabled={isLoading}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <PhoneHelp />
            </Field>
          )}
        />

        {/* Correo 1 */}
        <Controller
          control={control}
          name="VCorreo"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Primary Email *</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  placeholder="Enter primary email..."
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
