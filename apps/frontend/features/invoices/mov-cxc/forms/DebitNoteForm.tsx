"use client";

import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toDateOnly } from "@/lib/dateUtils";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { DebitNoteFormData } from "../schemas/mov-cxc-schema";
import { NumericFormat } from "react-number-format";
import { numericFormatSelectAllIfZero } from "@/lib/numeric-format";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface DebitNoteFormProps {
  form: UseFormReturn<DebitNoteFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  invoiceCreatedAt?: Date | null;
}

export function DebitNoteForm({
  form,
  onSubmit,
  onCancel,
  isLoading = false,
  invoiceCreatedAt,
}: DebitNoteFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Amount */}
      <Controller
        control={form.control}
        name="MCValor"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Amount *</FieldLabel>

            <NumericFormat
              value={field.value}
              onValueChange={(values) => {
                field.onChange(values.floatValue);
              }}
              disabled={isLoading}
              placeholder="0,00"
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              prefix="$"
              customInput={Input}
              {...numericFormatSelectAllIfZero(field.value)}
            />

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Document Number */}
      <Controller
        control={form.control}
        name="MCNroDocumento"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Document Number *</FieldLabel>

            <Input
              type="text"
              placeholder="Enter document number..."
              disabled={isLoading}
              {...field}
              onChange={field.onChange}
            />

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Description */}
      <Controller
        control={form.control}
        name="MCDescripcion"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Description *</FieldLabel>

            <Textarea
              placeholder="Enter description..."
              disabled={isLoading}
              rows={3}
              {...field}
            />

            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Date of Registration */}
      <Controller
        control={form.control}
        name="MCFecha"
        render={({ field, fieldState }) => (
          <Field className="flex flex-col">
            <FieldLabel>Date of Registration *</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground",
                  )}
                  disabled={isLoading}
                >
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => date && field.onChange(date)}
                  disabled={(date) => {
                    const d = toDateOnly(new Date(date));
                    const today = toDateOnly(new Date());
                    if (invoiceCreatedAt != null) {
                      const invDate = toDateOnly(invoiceCreatedAt);
                      return d < invDate || d > today;
                    }
                    return d > today || d < new Date("1900-01-01");
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="min-w-[120px]">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Debit Note
        </Button>
      </div>
    </form>
  );
}
