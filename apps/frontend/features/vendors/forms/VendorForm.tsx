"use client";

// Icons
import { Loader2, AlertCircle } from "lucide-react";

// Types
import type { UseFormReturn } from "react-hook-form";
import type { CreateVendorDto } from "../schemas/VendorSchema";

// UI Components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Form Fields
import { BasicInfoFields } from "./form-fields/BasicInfoFields";

interface VendedorFormProps {
  form: UseFormReturn<CreateVendorDto>;
  mode: "create" | "edit";
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function VendedorForm({
  form,
  mode,
  onSubmit,
  onCancel,
  isLoading = false,
}: VendedorFormProps) {
  const formTitle = mode === "create" ? "Create New Vendor" : "Edit Vendor";
  const submitButtonText =
    mode === "create" ? "Create Vendor" : "Update Vendor";

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
            ? "Fill in the information below to create a new vendor."
            : "Update the vendor information below."}
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
            Essential vendor details and identification.
          </p>
        </div>
        <BasicInfoFields
          control={form.control}
          isLoading={isLoading}
          mode={mode}
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
