"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BasicInfoFields } from "./form-fields/BasicInfoFields";
import { PricingFields } from "./form-fields/PricingFields";
import { MarginFields } from "./form-fields/MarginFields";
import { TaxFields } from "./form-fields/TaxFields";
import type { Producto } from "../types/server-types";
import type { UseFormReturn } from "react-hook-form";
import type { ProductFormData } from "../schemas/CatalogSchema";

interface ProductFormProps {
  form: UseFormReturn<ProductFormData>;
  mode: "create" | "edit";
  initialData?: Producto;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  form,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const formTitle = mode === "create" ? "Create New Product" : "Edit Product";
  const submitButtonText =
    mode === "create" ? "Create Product" : "Update Product";

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
            ? "Fill in the information below to create a new product."
            : "Update the product information below."}
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
            Essential product details and categorization.
          </p>
        </div>
        <BasicInfoFields
          control={form.control}
          mode={mode}
          initialData={initialData}
          isLoading={isLoading}
        />
      </div>

      <Separator />

      {/* Pricing Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Pricing Information</h3>
          <p className="text-sm text-muted-foreground">
            Set product prices for different sales channels.
          </p>
        </div>
        <PricingFields control={form.control} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Margin & Discount */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Margin & Discount</h3>
          <p className="text-sm text-muted-foreground">
            Configure margin percentages and discount limits.
          </p>
        </div>
        <MarginFields control={form.control} isLoading={isLoading} />
      </div>

      <Separator />

      {/* Tax Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-medium">Tax Information</h3>
          <p className="text-sm text-muted-foreground">
            Set VAT rate and tax exemption status.
          </p>
        </div>
        <TaxFields control={form.control} isLoading={isLoading} />
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
