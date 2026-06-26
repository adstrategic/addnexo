"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { PaymentFormData } from "../schemas/mov-cxc-schema";
import { toDateOnly } from "@/lib/dateUtils";
import { NumericFormat } from "react-number-format";
import { numericFormatSelectAllIfZero } from "@/lib/numeric-format";
import { BankSelector } from "@/components/shared/selectors/BankSelector";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface PaymentFormProps {
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  invoiceCreatedAt?: Date | null;
}

export function PaymentForm({
  form,
  onSubmit,
  onCancel,
  isLoading = false,
  invoiceCreatedAt,
}: PaymentFormProps) {
  const selectedPaymentType = form.watch("MCTipoPago");

  // Clear payment details and errors when payment type changes
  useEffect(() => {
    // Reset all payment detail fields to undefined
    form.setValue("walletDetails", undefined, { shouldValidate: false });
    form.setValue("creditCardDetails", undefined, { shouldValidate: false });
    form.setValue("transferDetails", undefined, { shouldValidate: false });
    form.setValue("checkDetails", undefined, { shouldValidate: false });

    // Clear any existing errors for payment details
    form.clearErrors("walletDetails");
    form.clearErrors("creditCardDetails");
    form.clearErrors("transferDetails");
    form.clearErrors("checkDetails");
  }, [selectedPaymentType, form]);

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

      {/* Payment Type */}
      <Controller
        control={form.control}
        name="MCTipoPago"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Payment Type *</FieldLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment type..." />
              </SelectTrigger>

              <SelectContent>
                {/* Simple types */}
                <SelectItem value="CONTADO">Cash</SelectItem>
                <SelectItem value="CANJE">Exchange</SelectItem>
                <SelectItem value="CREDITO">Credit</SelectItem>
                {/* Detailed types */}
                <SelectItem value="WALLET">Digital Wallet</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
              </SelectContent>
            </Select>
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
                  variant={"outline"}
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

      {/* Conditional: Wallet Details */}
      {selectedPaymentType === "WALLET" && (
        <div
          className={cn(
            "space-y-4 p-4 border rounded-lg bg-muted/50",
            form.formState.errors.walletDetails && "border-destructive",
          )}
        >
          <h4 className="font-medium text-sm">Wallet Details</h4>
          {/* Section-level error message */}
          {form.formState.errors.walletDetails &&
            typeof form.formState.errors.walletDetails === "object" &&
            "message" in form.formState.errors.walletDetails && (
              <p className="text-sm font-medium text-destructive">
                {String(form.formState.errors.walletDetails.message)}
              </p>
            )}
          <Controller
            control={form.control}
            name="walletDetails.WPBancoId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Bank *</FieldLabel>

                <BankSelector
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="walletDetails.WPNombreWallet"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Wallet Name *</FieldLabel>

                <Input
                  placeholder="e.g., Zelle, Nequi..."
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value ?? ""}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="walletDetails.WPTelefonoOClave"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Phone Number or Key *</FieldLabel>

                <Input
                  placeholder="Enter phone or key..."
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value ?? ""}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      )}

      {/* Conditional: Credit Card Details */}
      {selectedPaymentType === "CREDIT_CARD" && (
        <div
          className={cn(
            "space-y-4 p-4 border rounded-lg bg-muted/50",
            form.formState.errors.creditCardDetails && "border-destructive",
          )}
        >
          <h4 className="font-medium text-sm">Credit Card Details</h4>
          {/* Section-level error message */}
          {form.formState.errors.creditCardDetails &&
            typeof form.formState.errors.creditCardDetails === "object" &&
            "message" in form.formState.errors.creditCardDetails && (
              <p className="text-sm font-medium text-destructive">
                {String(form.formState.errors.creditCardDetails.message)}
              </p>
            )}
          <Controller
            control={form.control}
            name="creditCardDetails.CCPBancoId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Bank *</FieldLabel>

                <BankSelector
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="creditCardDetails.CCPMarca"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Card Brand *</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select card brand..." />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="VISA">Visa</SelectItem>
                    <SelectItem value="MASTERCARD">Mastercard</SelectItem>
                    <SelectItem value="AMEX">American Express</SelectItem>
                    <SelectItem value="DISCOVER">Discover</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="creditCardDetails.CCPUltimos4Digitos"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Last 4 Digits *</FieldLabel>

                <Input
                  type="text"
                  placeholder="1234"
                  maxLength={4}
                  disabled={isLoading}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 4) {
                      field.onChange(value);
                    }
                  }}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      )}

      {/* Conditional: Transfer Details */}
      {selectedPaymentType === "TRANSFER" && (
        <div
          className={cn(
            "space-y-4 p-4 border rounded-lg bg-muted/50",
            form.formState.errors.transferDetails && "border-destructive",
          )}
        >
          <h4 className="font-medium text-sm">Transfer Details</h4>
          {/* Section-level error message */}
          {form.formState.errors.transferDetails &&
            typeof form.formState.errors.transferDetails === "object" &&
            "message" in form.formState.errors.transferDetails && (
              <p className="text-sm font-medium text-destructive">
                {String(form.formState.errors.transferDetails.message)}
              </p>
            )}
          <Controller
            control={form.control}
            name="transferDetails.TPBancoId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Bank *</FieldLabel>

                <BankSelector
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="transferDetails.TPTipoCuenta"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Account Type *</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type..." />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="CHECKING">Checking</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="transferDetails.TPNumeroCuenta"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Account Number *</FieldLabel>

                <Input
                  placeholder="Enter account number..."
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value ?? ""}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      )}

      {/* Conditional: Check Details */}
      {selectedPaymentType === "CHECK" && (
        <div
          className={cn(
            "space-y-4 p-4 border rounded-lg bg-muted/50",
            form.formState.errors.checkDetails && "border-destructive",
          )}
        >
          <h4 className="font-medium text-sm">Check Details</h4>
          {/* Section-level error message */}
          {form.formState.errors.checkDetails &&
            typeof form.formState.errors.checkDetails === "object" &&
            "message" in form.formState.errors.checkDetails && (
              <p className="text-sm font-medium text-destructive">
                {String(form.formState.errors.checkDetails.message)}
              </p>
            )}
          <Controller
            control={form.control}
            name="checkDetails.CHPBancoId"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Bank *</FieldLabel>

                <BankSelector
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoading}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="checkDetails.CHPNumeroCheque"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>Check Number *</FieldLabel>

                <Input
                  placeholder="Enter check number..."
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value ?? ""}
                />

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="checkDetails.CHPFechaCheque"
            render={({ field, fieldState }) => (
              <Field className="flex flex-col">
                <FieldLabel>Check Date *</FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
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
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      )}

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
          Register Payment
        </Button>
      </div>
    </form>
  );
}
