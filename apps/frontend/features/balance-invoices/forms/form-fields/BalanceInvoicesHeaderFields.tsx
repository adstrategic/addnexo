"use client";

import {
  Control,
  Controller,
  useFormContext,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { useEffect } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, formatearFecha } from "@/lib/utils";
import type { CreateBalanceInvoiceHeaderData } from "../../schemas/BalanceInvoicesSchema";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { ClienteSelector } from "@/components/shared/selectors/ClienteSelector";
import { VendedorSelector } from "@/components/shared/selectors/VendedorSelector";
import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";
import type {
  Factura,
  TipoPago,
} from "../../schemas/BalanceInvoicesResponseSchema";
import { NumericFormat } from "react-number-format";
import { numericFormatSelectAllIfZero } from "@/lib/numeric-format";
import { useSaldosClienteAutofill } from "../../hooks/useBalanceInvoicesAutofill";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface BalanceInvoicesHeaderFieldsProps {
  control: Control<CreateBalanceInvoiceHeaderData>;
  factura?: Factura;
  setValue: UseFormSetValue<CreateBalanceInvoiceHeaderData>;
  FGPago: TipoPago;
}

export function BalanceInvoicesHeaderFields({
  control,
  factura,
  FGPago,
  setValue,
}: BalanceInvoicesHeaderFieldsProps) {
  const showPaymentConditions = FGPago === "CREDITO";

  // Hook para manejar el autocompletado cuando se selecciona un cliente
  const { handleClienteSelect, displayVendedor, displayCiudad } =
    useSaldosClienteAutofill({ factura, setValue });

  // Watch FGFechaCreado to restrict FGFechaVencimiento selection
  const fechaCreado = useWatch({
    control,
    name: "FGFechaCreado",
  });

  // Watch FGFechaVencimiento to clear it if FGFechaCreado changes and makes it invalid
  const fechaVencimiento = useWatch({
    control,
    name: "FGFechaVencimiento",
  });

  // Clear FGFechaVencimiento if it becomes invalid when FGFechaCreado changes
  useEffect(() => {
    if (fechaCreado && fechaVencimiento && fechaVencimiento < fechaCreado) {
      setValue("FGFechaVencimiento", undefined as any, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [fechaCreado, fechaVencimiento, setValue]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factura NRO */}
        <Controller
          control={control}
          name="FGNro"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Invoice Number *</FieldLabel>

              <NumericFormat
                value={field.value}
                onValueChange={(values) => {
                  field.onChange(values.floatValue);
                }}
                placeholder="Invoice number..."
                decimalScale={0}
                customInput={Input}
                {...numericFormatSelectAllIfZero(field.value)}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Purchase Order */}
        <Controller
          control={control}
          name="FGPurchaseOrder"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Purchase Order (Optional)</FieldLabel>

              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Purchase order..."
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Customer */}
        <Controller
          control={control}
          name="FGClienteId"
          render={({ field, fieldState }) => (
            <ClienteSelector
              field={field}
              fieldState={fieldState}
              initialClient={factura?.cltemae || null}
              onClienteSelect={handleClienteSelect}
            />
          )}
        />

        {/* Vendor */}
        <Controller
          control={control}
          name="FGVendedorId"
          render={({ field, fieldState }) => (
            <VendedorSelector
              field={field}
              fieldState={fieldState}
              initialVendor={displayVendedor}
            />
          )}
        />

        {/* Payment Type */}
        <Controller
          control={control}
          name="FGPago"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Payment Type *</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type..." />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="CONTADO">Cash</SelectItem>
                  <SelectItem value="CANJE">Exchange</SelectItem>
                  <SelectItem value="CREDITO">Credit</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Total Amount */}
        <Controller
          control={control}
          name="FGValorTotal"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Total Amount *</FieldLabel>

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
                {...numericFormatSelectAllIfZero(field.value)}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Issue Date */}
        <Controller
          control={control}
          name="FGFechaCreado"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Issue Date *</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                    type="button"
                  >
                    {field.value ? (
                      formatearFecha(field.value)
                    ) : (
                      <span>Select date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Due Date */}
        <Controller
          control={control}
          name="FGFechaVencimiento"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Due Date *</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                    type="button"
                    disabled={!fechaCreado}
                  >
                    {field.value ? (
                      formatearFecha(field.value)
                    ) : (
                      <span>
                        {fechaCreado
                          ? "Select date"
                          : "Select issue date first"}
                      </span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => {
                      // Disable dates before or equal to FGFechaCreado
                      if (!fechaCreado) return true;
                      // Set time to start of day for comparison
                      const fechaCreadoStart = new Date(fechaCreado);
                      fechaCreadoStart.setHours(0, 0, 0, 0);
                      const dateStart = new Date(date);
                      dateStart.setHours(0, 0, 0, 0);
                      return dateStart < fechaCreadoStart;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Delivery Address */}
        <Controller
          control={control}
          name="FGDireccionEntrega"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Delivery Address</FieldLabel>

              <Input {...field} placeholder="Delivery address..." />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Delivery City */}
        <Controller
          control={control}
          name="FGCiudadId"
          render={({ field, fieldState }) => (
            <CiudadSelector
              field={field}
              fieldState={fieldState}
              initialCiudad={displayCiudad}
            />
          )}
        />

        {/* Teléfono 1 */}
        <Controller
          control={control}
          name="FGTelefono1"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Primary Phone *</FieldLabel>

              <PhoneInputField
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Enter primary phone..."
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <PhoneHelp />
            </Field>
          )}
        />

        {/* Teléfono 2 */}
        <Controller
          control={control}
          name="FGTelefono2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Secondary Phone</FieldLabel>

              <PhoneInputField
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Enter secondary phone..."
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              <PhoneHelp />
            </Field>
          )}
        />

        {/* Correo 1 */}
        <Controller
          control={control}
          name="FGCorreo1"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Primary Email *</FieldLabel>

              <Input
                type="email"
                placeholder="Enter primary email..."
                {...field}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Correo 2 */}
        <Controller
          control={control}
          name="FGCorreo2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Secondary Email</FieldLabel>

              <Input
                type="email"
                placeholder="Enter secondary email..."
                {...field}
                value={field.value ?? ""}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      {/* Payment Conditions (only for credit) */}
      {showPaymentConditions && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium">Payment Conditions *</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              control={control}
              name="FGCondicion1"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Condition 1</FieldLabel>

                  <Textarea
                    {...field}
                    placeholder="Payment condition..."
                    rows={2}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="FGCondicion2"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Condition 2</FieldLabel>

                  <Textarea
                    {...field}
                    placeholder="Payment condition..."
                    rows={2}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={control}
              name="FGCondicion3"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Condition 3</FieldLabel>

                  <Textarea
                    {...field}
                    placeholder="Payment condition..."
                    rows={2}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
