"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { ContactFields } from "./form-fields/ContactFields";
import { BusinessTermsFields } from "./form-fields/BusinessTermsFields";
import type { ClienteResponse } from "../schemas/ClientSchema";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { ClientFormData } from "../schemas/ClientSchema";
import {
  // CiudadSelector,
  VendedorSelector,
} from "@/components/shared/selectors";
import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";

interface ClientFormProps {
  form: UseFormReturn<ClientFormData>;
  mode: "create" | "edit";
  initialData?: ClienteResponse;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ClientForm({
  form,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClientFormProps) {
  const formTitle = mode === "create" ? "Create New Client" : "Edit Client";
  const submitButtonText =
    mode === "create" ? "Create Client" : "Update Client";

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
            ? "Fill in the information below to create a new client."
            : "Update the client information below."}
        </p>
      </div>

      <Separator />

      {/* Root Error */}
      {rootError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {typeof rootError.message === "string"
              ? rootError.message
              : typeof rootError.message === "object" &&
                  rootError.message !== null
                ? JSON.stringify(rootError.message)
                : "An error occurred"}
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Essential client details and identification.
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
          name="CCiudadId"
          render={({ field, fieldState }) => (
            <CiudadSelector
              field={field}
              fieldState={fieldState}
              initialCiudad={initialData?.ciudad || null}
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
            Payment terms, credit limits, and financial settings.
          </p>
        </div>
        <BusinessTermsFields control={form.control} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Vendor Assignment */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Vendor Assignment</h3>
          <p className="text-sm text-muted-foreground">
            Assign a vendor to manage this client relationship.
          </p>
        </div>
        <Controller
          control={form.control}
          name="CVendedorVId"
          render={({ field, fieldState }) => (
            <VendedorSelector
              field={field}
              initialVendor={initialData?.vendedor || null}
              fieldState={fieldState}
            />
          )}
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
