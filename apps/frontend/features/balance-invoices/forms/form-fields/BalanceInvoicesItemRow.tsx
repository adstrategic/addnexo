"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Controller,
  FieldArrayWithId,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

import type { ServerBalanceInvoicesItem } from "../../schemas/BalanceInvoicesResponseSchema";
import { useDebouncedFieldUpdate } from "../hooks/useDebouncedFieldUpdate";
import { ItemsFormData } from "../hooks/useBalanceInvoicesItemsForm";
import { NumericFormat } from "react-number-format";
import { numericFormatSelectAllIfZero } from "@/lib/numeric-format";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

interface BalanceInvoiceItemRowProps {
  index: number;
  field: FieldArrayWithId<ItemsFormData, "items", "id">;
  facturaId: number | null;
  dbItem?: ServerBalanceInvoicesItem;
  submitHandler: (mode: "add" | "update", itemId?: number) => Promise<void>;
  FGValorTotal?: number; // Total amount from header form for validation
}

/**
 * Componente simplificado para item de factura manual
 * Solo permite 1 item del grupo 999, cantidad siempre es 1 (read-only)
 * Usa el formulario de items independiente (ItemsFormData)
 */
export function BalanceInvoiceItemRow({
  index,
  field,
  facturaId,
  dbItem,
  submitHandler,
  FGValorTotal,
}: BalanceInvoiceItemRowProps) {
  const form = useFormContext<ItemsFormData>(); // ✅ Formulario de items, no del header
  const itemExistsInDb = !!dbItem?.FUId;

  // Track if item is being added/updated
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch valores del formulario
  const productoId = useWatch({
    control: form.control,
    name: `items.${index}.FUInvcaruniId`,
  });
  const precioUnitario = useWatch({
    control: form.control,
    name: `items.${index}.FUVrUnitario`,
  });

  // Handle price update (debounced para items en DB)
  const handleDebouncedUpdate = useCallback(
    async (fieldName: "FUVrUnitario", value: any) => {
      if (itemExistsInDb && dbItem?.FUId) {
        setIsSubmitting(true);
        try {
          await submitHandler("update", dbItem.FUId);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [itemExistsInDb, dbItem, submitHandler],
  );

  useDebouncedFieldUpdate<ItemsFormData>({
    control: form.control,
    index,
    fieldName: "FUVrUnitario",
    serverValue: dbItem?.FUVrUnitario,
    itemExistsInDb,
    onUpdate: handleDebouncedUpdate,
    delayMs: 600,
    fieldPath: `items.${index}.FUVrUnitario`,
  });

  return (
    <TableRow key={field.id}>
      {/* Product Field */}
      <TableCell>
        <div className="flex items-center gap-2">
          {dbItem?.invcaruni?.CKDescripcion || "Unknown Product"}
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </TableCell>

      {/* Quantity Field - Read-only, always 1 */}
      <TableCell>
        <div className="flex items-center">
          <Input
            value={1}
            readOnly
            disabled
            className="w-20 bg-muted"
            type="number"
          />
        </div>
      </TableCell>

      {/* Price Field */}
      <TableCell>
        <Controller
          control={form.control}
          name={`items.${index}.FUVrUnitario`}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Price *</FieldLabel>
              <div className="relative">
                <NumericFormat
                  value={field.value}
                  onValueChange={(values) => {
                    field.onChange(values.floatValue ?? null);
                  }}
                  placeholder="0,00"
                  disabled={isSubmitting}
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  prefix="$"
                  customInput={Input}
                  {...numericFormatSelectAllIfZero(field.value)}
                />
                {isSubmitting && (
                  <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />
                )}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </TableCell>
    </TableRow>
  );
}
