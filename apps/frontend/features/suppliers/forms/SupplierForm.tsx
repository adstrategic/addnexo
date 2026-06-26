"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { ContactFields } from "./form-fields/ContactFields";
import { BusinessTermsFields } from "./form-fields/BusinessTermsFields";
// import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";
import {
  CreateSupplierDTO,
  SupplierResponse,
} from "../schemas/SupplierSchemas";
import { Controller, UseFormReturn } from "react-hook-form";
import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";
import { Ciudad } from "@/features/geography";
import { FieldError } from "@/components/ui/field";

interface SupplierFormProps {
  form: UseFormReturn<CreateSupplierDTO>;
  mode: "create" | "edit";
  initialData?: SupplierResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function SupplierForm({
  form,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SupplierFormProps) {
  const formTitle = mode === "create" ? "Create New Supplier" : "Edit Supplier";
  const submitButtonText =
    mode === "create" ? "Create Supplier" : "Update Supplier";

  // Get root error for display
  const rootError = form.formState.errors.root;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{formTitle}</h2>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Fill in the information below to create a new supplier."
            : "Update the supplier information below."}
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
            Essential supplier details and identification.
          </p>
        </div>
        <BasicInfoFields
          mode={mode}
          control={form.control}
          isLoading={isLoading}
        />
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Contact Information</h3>
          <p className="text-sm text-muted-foreground">
            Phone numbers and email addresses for communication.
          </p>
        </div>
        <ContactFields control={form.control} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Location */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Location</h3>
          <p className="text-sm text-muted-foreground">
            Geographic location for shipping and billing.
          </p>
        </div>
        <Controller
          control={form.control}
          name="MPCiudadId"
          render={({ field, fieldState }) => (
            <CiudadSelector
              field={field}
              fieldState={fieldState}
              initialCiudad={(initialData?.ciudad ?? null) as Ciudad | null}
              label="City *"
            />
          )}
        />
      </div>

      <Separator />

      {/* Business Terms */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Business Terms</h3>
          <p className="text-sm text-muted-foreground">
            Retention settings and supplier number.
          </p>
        </div>
        <BusinessTermsFields
          control={form.control}
          isLoading={isLoading}
          mode={mode}
        />
      </div>

      <Separator />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
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

      {/* Form Status Indicator */}
      {mode === "edit" && form.formState.isDirty && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          * You have unsaved changes
        </div>
      )}
    </form>
  );
}
