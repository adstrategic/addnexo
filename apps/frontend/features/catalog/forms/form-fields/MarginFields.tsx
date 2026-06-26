"use client";

import { Control, Controller, useWatch } from "react-hook-form";

import { ProductFormData } from "../../schemas/CatalogSchema";
import { Input } from "@/components/ui/input";
import { NumericFormat } from "react-number-format";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface MarginFieldsProps {
  control: Control<ProductFormData>;
  isLoading?: boolean;
}

export function MarginFields({
  control,
  isLoading = false,
}: MarginFieldsProps) {
  // Watch the fields to determine disabled states
  const marginDiscount = useWatch({ control, name: "CKPorcenMargenTopeDesc" });
  const discountLimit = useWatch({ control, name: "CKTopeDescuento" });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Margin Discount Percentage */}
        <Controller
          control={control}
          name="CKPorcenMargenTopeDesc"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Margin Discount Percentage *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  decimalSeparator=","
                  decimalScale={2}
                  disabled={isLoading || discountLimit > 0}
                  max={100}
                  suffix="%"
                  customInput={Input}
                  // required
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              {discountLimit > 0 && (
                <p className="text-sm text-muted-foreground">
                  This field is disabled when Discount Limit is set
                </p>
              )}
            </Field>
          )}
        />

        {/* Discount Limit */}
        <Controller
          control={control}
          name="CKTopeDescuento"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Discount Limit *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="$"
                  customInput={Input}
                  disabled={isLoading || marginDiscount > 0}
                  // required
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              {marginDiscount > 0 && (
                <p className="text-sm text-muted-foreground">
                  This field is disabled when Margin Discount Percentage is set
                </p>
              )}
            </Field>
          )}
        />

        {/* Margin Percentage */}
        <Controller
          control={control}
          name="CKPorcenMargen"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Margin Percentage *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  decimalSeparator=","
                  decimalScale={2}
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
      </div>
    </div>
  );
}
