"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreateBankDto } from "../schemas/BankSchema";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface BankFormProps {
  form: UseFormReturn<CreateBankDto>;
  mode: "create" | "edit";
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function BankForm({
  form,
  mode,
  onSubmit,
  onCancel,
  isLoading = false,
}: BankFormProps) {
  const formTitle = mode === "create" ? "Create New Bank" : "Edit Bank";
  const submitButtonText = mode === "create" ? "Create Bank" : "Update Bank";

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
            ? "Complete the form to register a new bank in the system."
            : "Update bank information in the system."}
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
          name="BNombre"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Bank Name *</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="Ex: Bancolombia"
                  maxLength={100}
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
  );
}
