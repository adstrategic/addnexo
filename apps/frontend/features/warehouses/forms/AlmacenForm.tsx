"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";
import { Loader2, AlertCircle } from "lucide-react";
import type { Ciudad } from "@/features/geography";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Controller, type UseFormReturn } from "react-hook-form";
import type {
  AlmacenResponse,
  CreateAlmacenDto,
} from "../schemas/almacenes.schema";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { PhoneHelp } from "@/components/phone-input/phone-help";

interface AlmacenFormProps {
  form: UseFormReturn<CreateAlmacenDto>;
  mode: "create" | "edit";
  initialData?: AlmacenResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function AlmacenForm({
  form,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AlmacenFormProps) {
  const formTitle =
    mode === "create" ? "Create New Warehouse" : "Edit Warehouse";
  const submitButtonText =
    mode === "create" ? "Create Warehouse" : "Update Warehouse";

  const rootError = form.formState.errors.root as
    | { message?: string }
    | undefined;
  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{formTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Fill in the information below to create a new warehouse."
            : "Update the warehouse information below."}
        </p>
      </div>

      <Separator />

      {rootError?.message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{rootError.message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Essential warehouse details and location.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            control={form.control}
            name="ALCiudadId"
            render={({ field, fieldState }) => (
              <CiudadSelector
                field={field}
                fieldState={fieldState}
                initialCiudad={(initialData?.ciudad ?? null) as Ciudad | null}
                label="City *"
              />
            )}
          />

          <Controller
            control={form.control}
            name="ALNombre"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Ex: Main Warehouse"
                    maxLength={50}
                    disabled={isLoading}
                    {...field}
                  />
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="ALResponsable"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Responsible *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Ex: John Doe"
                    maxLength={50}
                    disabled={isLoading}
                    {...field}
                  />
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="ALDireccion"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Address *</FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Ex: 123 Main St"
                    maxLength={50}
                    disabled={isLoading}
                    {...field}
                  />
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="ALTelefono"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Phone *</FieldLabel>
                <FieldContent>
                  <PhoneInputField
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Ej: +57 301 123 4567"
                    disabled={isLoading}
                  />
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
                <PhoneHelp />
              </Field>
            )}
          />
        </div>
      </div>

      <Separator />

      <div className="flex items-center gap-2">
        {mode === "edit" && isDirty && (
          <div className="text-sm text-muted-foreground text-center pt-2 w-full">
            * You have unsaved changes
          </div>
        )}
        <div className="w-full flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                form.reset();
              }
            }}
            disabled={isLoading}
          >
            {onCancel ? "Cancel" : "Reset"}
          </Button>

          <Button type="submit" disabled={isLoading} className="min-w-[120px]">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
