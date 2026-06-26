"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { RequirementsFields } from "./form-fields/RequirementsFields";
import { ConfigurationFields } from "./form-fields/ConfigurationFields";
import type { TipoMovimiento } from "../types/server-types";
import type { UseFormReturn } from "react-hook-form";
import type { MovementTypeFormData } from "../schemas/movement-type-schema";

interface MovementTypeFormProps {
  form: UseFormReturn<MovementTypeFormData>;
  mode: "create" | "edit";
  initialData?: TipoMovimiento;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function MovementTypeForm({
  form,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: MovementTypeFormProps) {
  const formTitle =
    mode === "create" ? "Create New Movement Type" : "Edit Movement Type";
  const submitButtonText =
    mode === "create" ? "Create Movement Type" : "Update Movement Type";

  // Get root error for display
  const rootError = form.formState.errors.root;
  const isDirty = form.formState.isDirty;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{formTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Complete the form to register a new movement type in the system."
            : "Update movement type information in the system."}
        </p>
      </div>

      <Separator />

      {/* Root Error */}
      {rootError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{rootError.message}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Essential movement type details and identification.
          </p>
        </div>
        <BasicInfoFields
          mode={mode}
          control={form.control}
          setValue={form.setValue}
          isLoading={isLoading}
        />
      </div>

      <Separator />

      {/* Requirements */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Requirements</h3>
          <p className="text-sm text-muted-foreground">
            Configure what documents and entities are required for this movement
            type.
          </p>
        </div>
        <RequirementsFields control={form.control} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Set inventory and cost calculation behavior.
          </p>
        </div>
        <ConfigurationFields
          control={form.control}
          setValue={form.setValue}
          isLoading={isLoading}
          mode={mode}
          existingPurpose={initialData?.TProposito}
          movementTypeId={initialData?.TId}
        />
      </div>

      <Separator />

      {/* Form Actions */}
      <div className="flex items-center gap-2">
        {/* Form Status Indicator */}
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
