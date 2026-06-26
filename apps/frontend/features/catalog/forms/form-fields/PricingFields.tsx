"use client";

import { Control, Controller } from "react-hook-form";

import { ProductFormData } from "../../schemas/CatalogSchema";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface PricingFieldsProps {
  control: Control<ProductFormData>;
  isLoading?: boolean;
}

export function PricingFields({
  control,
  isLoading = false,
}: PricingFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Public Price */}
        <Controller
          control={control}
          name="CKPrecioPublico"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Public Price *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  disabled={isLoading}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="$"
                  customInput={Input}
                  required
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Sale Price 1 */}
        <Controller
          control={control}
          name="CKPrecioVenta1"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Sale Price 1 *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  disabled={isLoading}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="$"
                  customInput={Input}
                  required
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Sale Price 2 */}
        <Controller
          control={control}
          name="CKPrecioVenta2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Sale Price 2 *</FieldLabel>
              <FieldContent>
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue);
                  }}
                  placeholder="0,00"
                  disabled={isLoading}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="$"
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
