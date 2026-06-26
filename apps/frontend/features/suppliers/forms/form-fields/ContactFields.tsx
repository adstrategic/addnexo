"use client";

import { Control, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { CreateSupplierDTO } from "../../schemas/SupplierSchemas";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface ContactFieldsProps {
  control: Control<CreateSupplierDTO>;
  isLoading?: boolean;
}

export function ContactFields({
  control,
  isLoading = false,
}: ContactFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone 1 */}
        <Controller
          control={control}
          name="MPTelefono1"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Main Phone *</FieldLabel>
              <FieldContent>
                <PhoneInputField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Ej: +57 301 123 4567"
                  disabled={isLoading}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <PhoneHelp />
            </Field>
          )}
        />

        {/* Phone 2 */}
        <Controller
          control={control}
          name="MPTelefono2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Phone 2</FieldLabel>
              <FieldContent>
                <PhoneInputField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Ej: +57 301 123 4567"
                  disabled={isLoading}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <PhoneHelp />
            </Field>
          )}
        />

        {/* Email 1 */}
        <Controller
          control={control}
          name="MPCorreo1"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Main Email *</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Email 2 */}
        <Controller
          control={control}
          name="MPCorreo2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Email 2</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
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
