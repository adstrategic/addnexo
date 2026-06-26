"use client";

import { Control, Controller } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { ClientFormData } from "../../schemas/ClientSchema";

interface ContactFieldsProps {
  control: Control<ClientFormData>;
  isLoading?: boolean;
}

export function ContactFields({
  control,
  isLoading = false,
}: ContactFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teléfono 1 */}
        <Controller
          control={control}
          name="CTelefono1"
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

        {/* Teléfono 2 */}
        <Controller
          control={control}
          name="CTelefono2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Secondary Phone</FieldLabel>
              <FieldContent>
                <PhoneInputField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Enter secondary phone..."
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
          name="CCorreo1"
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

        {/* Correo 2 */}
        <Controller
          control={control}
          name="CCorreo2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Secondary Email</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  placeholder="Enter secondary email..."
                  disabled={isLoading}
                  {...field}
                  value={field.value ?? ""}
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
