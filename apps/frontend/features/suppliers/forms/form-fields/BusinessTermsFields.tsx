"use client";

import { Control, Controller } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateSupplierDTO } from "../../schemas/SupplierSchemas";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

interface BusinessTermsFieldsProps {
  control: Control<CreateSupplierDTO>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function BusinessTermsFields({
  control,
  isLoading = false,
  mode,
}: BusinessTermsFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retention */}
        <Controller
          control={control}
          name="MPRetencion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Retention</FieldLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <FieldContent>
                  <SelectTrigger>
                    <SelectValue placeholder="Retention applies?" />
                  </SelectTrigger>
                </FieldContent>
                <SelectContent>
                  <SelectItem value="NO">No</SelectItem>
                  <SelectItem value="SI">Yes</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Supplier Number */}
        <Controller
          control={control}
          name="MPNro"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Supplier Number *</FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  placeholder="Ej: 103105247896"
                  disabled={isLoading || mode === "edit"}
                  {...field}
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
