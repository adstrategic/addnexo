"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { UnitResponse, CreateUnitDto } from "../schemas/units.schema";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface UnitFormProps {
  form: UseFormReturn<CreateUnitDto>;
  mode: "create" | "edit";
  initialData?: UnitResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function UnitForm({
  form,
  mode,
  onSubmit,
  onCancel,
  isLoading = false,
}: UnitFormProps) {
  const formTitle = mode === "create" ? "Create New Unit" : "Edit Unit";
  const submitButtonText = mode === "create" ? "Create Unit" : "Update Unit";

  const rootError = form.formState.errors.root as
    | { message?: string }
    | undefined;
  const isDirty = form.formState.isDirty;

  return (
    // <Form {...form}>
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{formTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Complete the form to register a new unit in the system."
            : "Update unit information in the system."}
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
        <Controller
          control={form.control}
          name="UMNombre"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Unit Name *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ex: KG"
                  maxLength={10}
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="UMDescripcion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Description *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ex: Kilogram"
                  maxLength={30}
                  disabled={isLoading}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : form.reset())}
          disabled={isLoading}
        >
          {onCancel ? "Cancel" : "Reset"}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </div>

      {mode === "edit" && isDirty && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          * You have unsaved changes
        </div>
      )}
    </form>
    // </Form>
  );
}
