"use client";

import { Control, Controller, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { ProductFormData } from "../../schemas/CatalogSchema";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface TaxFieldsProps {
  control: Control<ProductFormData>;
  isLoading?: boolean;
}

export function TaxFields({ control, isLoading = false }: TaxFieldsProps) {
  // Watch the exempt field to determine disabled state
  const exempt = useWatch({ control, name: "CKExento" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* VAT */}
        <Controller
          control={control}
          name="CKIva"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>VAT *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  decimalSeparator=","
                  decimalScale={2}
                  disabled={isLoading || exempt}
                  max={100}
                  suffix="%"
                  customInput={Input}
                  required
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Exempt */}
        <Controller
          control={control}
          name="CKExento"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Tax Exempt</FieldLabel>
              <FieldContent>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="CKExento"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="CKExento"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exempt?
                  </label>
                </div>
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              {exempt && (
                <p className="text-sm text-muted-foreground">
                  VAT field is disabled when product is exempt
                </p>
              )}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
