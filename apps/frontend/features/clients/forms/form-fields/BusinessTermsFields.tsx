"use client";

import { Control, Controller } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn, formatearFecha } from "@/lib/utils";
import { ClientFormData } from "../../schemas/ClientSchema";

interface BusinessTermsFieldsProps {
  control: Control<ClientFormData>;
  isLoading?: boolean;
}

export function BusinessTermsFields({
  control,
  isLoading = false,
}: BusinessTermsFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Días para vencer factura */}
        <Controller
          control={control}
          name="CDiasParaVencerFactura"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Payment Terms (Days)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  placeholder="30"
                  min="1"
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Recordatorio post vencido */}
        <Controller
          control={control}
          name="CRecordatorioPostVencido"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Overdue Reminder (Days)</FieldLabel>
              <FieldContent>
                <Input
                  type="number"
                  placeholder="5"
                  min="1"
                  disabled={isLoading}
                  {...field}
                  onChange={field.onChange}
                  value={field.value}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Cupo autorizado */}
        <Controller
          control={control}
          name="CCupoAutorizado"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Credit Limit</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    min="0"
                    disabled={isLoading}
                    {...field}
                    onChange={field.onChange}
                    value={field.value}
                    className="pl-7"
                  />
                </div>
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Abonos */}
        <Controller
          control={control}
          name="CAbonos"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Current Balance</FieldLabel>
              <FieldContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    min="0"
                    disabled={isLoading}
                    {...field}
                    onChange={field.onChange}
                    value={field.value}
                    className="pl-7"
                  />
                </div>
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Fecha de ingreso */}
        <Controller
          control={control}
          name="CFechaIngreso"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Registration Date</FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FieldContent>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                      disabled={isLoading}
                      type="button"
                    >
                      {field.value ? (
                        formatearFecha(field.value)
                      ) : (
                        <span>Select date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FieldContent>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
