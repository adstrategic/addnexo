"use client";

import { Control, Controller, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn, formatearFecha } from "@/lib/utils";
import type { DispatchOrderHeaderFormData } from "../../schemas/dispatch-order-schema";
import { PhoneHelp } from "@/components/phone-input/phone-help";
import { PhoneInputField } from "@/components/phone-input/phone-input";
import { ClienteSelector } from "@/components/shared/selectors/ClienteSelector";
import { VendedorSelector } from "@/components/shared/selectors/VendedorSelector";
import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";
import type { DispatchOrderResponse } from "../../schemas/dispatch-order-response.schema";
import { useDispatchClienteAutofill } from "../../hooks/useDispatchClienteAutofill";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface DispatchOrderHeaderFieldsProps {
  control: Control<DispatchOrderHeaderFormData>;
  setValue: UseFormSetValue<DispatchOrderHeaderFormData>;
  dispatchOrder?: DispatchOrderResponse;
}

export function DispatchOrderHeaderFields({
  control,
  setValue,
  dispatchOrder,
}: DispatchOrderHeaderFieldsProps) {
  // Hook para manejar el autocompletado cuando se selecciona un cliente
  const { handleClienteSelect, displayVendedor, displayCiudad } =
    useDispatchClienteAutofill({ dispatchOrder, setValue });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Address */}
        <Controller
          control={control}
          name="DOGPurchaseOrder"
          render={({ field, fieldState }) => (
            <Field className="col-span-2">
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
          name="DOGClienteId"
          render={({ field, fieldState }) => (
            <ClienteSelector
              field={field}
              fieldState={fieldState}
              initialClient={dispatchOrder?.cltemae || null}
              onClienteSelect={handleClienteSelect}
            />
          )}
        />

        {/* Vendor (Optional) */}
        {/* TODO: add fieldstate and the error message inside the selector and for all selectors */}
        <Controller
          control={control}
          name="DOGVendedorId"
          render={({ field, fieldState }) => (
            <VendedorSelector
              field={field}
              fieldState={fieldState}
              initialVendor={displayVendedor}
            />
          )}
        />

        {/* Issue Date */}
        <Controller
          control={control}
          name="DOGFechaCreado"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Created Date</FieldLabel>
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

        {/* Delivery Address */}
        <Controller
          control={control}
          name="DOGDireccionEntrega"
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
          name="DOGCiudadId"
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
          name="DOGTelefono1"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Primary Phone *</FieldLabel>

              <PhoneInputField
                value={field.value || ""}
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
          name="DOGTelefono2"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Secondary Phone</FieldLabel>

              <PhoneInputField
                value={field.value || ""}
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
          name="DOGCorreo1"
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
          name="DOGCorreo2"
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
    </div>
  );
}
