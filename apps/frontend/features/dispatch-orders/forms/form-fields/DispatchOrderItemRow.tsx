"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  FieldArrayWithId,
  useWatch,
  useFormContext,
  Controller,
  type UseFormSetError,
} from "react-hook-form";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2 } from "lucide-react";
import { z } from "zod";
import { dispatchOrderItemSchema } from "../../schemas/dispatch-order-schema";
import type { DispatchOrderItemResponse } from "../../schemas/dispatch-order-response.schema";
import type { DispatchOrderItemsFormValues } from "../hooks/useDispatchOrderItemsForm";
import { ProductoSelector } from "@/components/shared/selectors/ProductoSelector";
import { LotSelector } from "@/components/shared/selectors/LotSelector";
import { useFirstAlmacen } from "../../hooks/useFirstAlmacen";
import { useCostoPromedio } from "@/features/movements/hooks/useCostoPromedio";
import { useDebouncedFieldUpdate } from "../hooks/useDebouncedFieldUpdate";
import {
  useAddDispatchOrderItem,
  useUpdateDispatchOrderItem,
  useDeleteDispatchOrderItem,
} from "../../hooks/useDispatchOrders";
import { useQueryClient } from "@tanstack/react-query";
import { dispatchOrderKeys } from "../../hooks/useDispatchOrders";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { Field, FieldError } from "@/components/ui/field";
import { ApiError } from "@/lib/errors/handler";

/**
 * Applies a server error to the correct row field. When the API error carries a
 * `fields` map (e.g. insufficient stock → { DOUCantidad }), each key is mapped to
 * its indexed form path so the message lands on that input. Falls back to
 * `fallbackField` when no field map is present. Returns the resolved message.
 */
function applyItemServerError(
  error: unknown,
  setError: UseFormSetError<DispatchOrderItemsFormValues>,
  index: number,
  fallbackField: string,
  fallbackMessage: string,
): string {
  const message =
    (error instanceof Error ? error.message : undefined) ?? fallbackMessage;
  const fields = error instanceof ApiError ? error.fields : undefined;

  if (fields && Object.keys(fields).length > 0) {
    for (const [fieldName, messages] of Object.entries(fields)) {
      setError(`dispatchOrderU.${index}.${fieldName}` as never, {
        type: "server",
        message: messages[0] ?? message,
      });
    }
  } else {
    setError(`dispatchOrderU.${index}.${fallbackField}` as never, {
      type: "server",
      message,
    });
  }

  return message;
}

interface DispatchOrderItemRowProps {
  orderId: number;
  field: FieldArrayWithId<
    DispatchOrderItemsFormValues,
    "dispatchOrderU",
    "id"
  >;
  index: number;
  onRemove: (index: number) => void;
  DOGPago: "CONTADO" | "CANJE" | "CREDITO";
  details?: DispatchOrderItemResponse[];
  /** Resolved by DOUId from parent so row order is preserved when form order differs from server order */
  existingItem?: DispatchOrderItemResponse;
  manualLotSelection: "MANUAL" | "AUTOMATICO";
}

export function DispatchOrderItemRow({
  orderId,
  field,
  index,
  onRemove,
  DOGPago,
  details,
  existingItem: existingItemProp,
  manualLotSelection,
}: DispatchOrderItemRowProps) {
  const queryClient = useQueryClient();
  const secuencia = orderId;
  const form = useFormContext<DispatchOrderItemsFormValues>();
  const { control, setValue } = form;

  // Use existingItem from parent (resolved by DOUId); fallback to details?.[index] for backward compatibility
  const existingItem = existingItemProp ?? details?.[index];

  // Watch form values
  const productoId = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUInvcaruniId`,
  });
  const cantidad = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUCantidad`,
  });
  const precioUnitario = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUVrUnitario`,
  });
  const descuento = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUDescuento`,
  });
  const tieneImpuesto = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUTieneImpuesto`,
  });
  const lote = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOULote`,
  });
  const nroDocumento = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUNroDocumento`,
  });
  const reservar = useWatch({
    control,
    name: `dispatchOrderU.${index}.DOUReservar`,
  });

  const itemExistsInDb = !!existingItem?.DOUId;
  // Use existing item's mode if it exists, otherwise use the current selection mode
  const itemModoSalida = existingItem?.DOUModoSalida || manualLotSelection;

  // Track if item is being added/updated
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [updatingFields, setUpdatingFields] = useState<Set<string>>(new Set());
  const [priceWarning, setPriceWarning] = useState<string | null>(null);
  const formatWeightKg = useCallback((value: number) => value.toFixed(2), []);

  // Mutations
  const addItemMutation = useAddDispatchOrderItem();
  const updateItemMutation = useUpdateDispatchOrderItem();
  const deleteItemMutation = useDeleteDispatchOrderItem();

  // Get first almacen
  const { almacenId, isLoading: loadingAlmacen } = useFirstAlmacen();

  // Fetch average cost for validation on initial load
  const { data: costoPromedio = 0 } = useCostoPromedio({
    productoId: existingItem?.DOUInvcaruniId,
    almacenId: almacenId,
  });

  // Validate price on initial load and when values change
  useEffect(() => {
    if (!itemExistsInDb || !existingItem) return;

    const currentPrice = existingItem.DOUVrUnitario;

    // Check if price <= 0 - Set form error
    if (currentPrice <= 0) {
      form.setError(`dispatchOrderU.${index}.DOUVrUnitario` as any, {
        type: "custom",
        message: "Unit price must be greater than 0",
      });
    } else {
      // Clear error if price is valid
      form.clearErrors(`dispatchOrderU.${index}.DOUVrUnitario` as any);
    }

    // Check if price < average cost - Set warning
    if (costoPromedio > 0 && currentPrice > 0 && currentPrice < costoPromedio) {
      setPriceWarning(
        `Unit price is less than average cost (${costoPromedio})`,
      );
    } else {
      setPriceWarning(null);
    }
  }, [itemExistsInDb, existingItem?.DOUVrUnitario, costoPromedio, index]);

  // Store selected product info for manual mode (needed when lot is selected later)
  const selectedProductRef = useRef<{
    CKId: number;
    precio: number;
    pesoPromedioKg: number;
  } | null>(null);

  // Helper to validate field value using Zod schema
  const validateField = useCallback((fieldName: string, value: any) => {
    try {
      const fieldSchema =
        dispatchOrderItemSchema.shape[
          fieldName as keyof typeof dispatchOrderItemSchema.shape
        ];
      if (!fieldSchema) return { success: true, data: value }; // No schema for this field

      const result = fieldSchema.safeParse(value);
      return result;
    } catch (error) {
      return { success: false, error };
    }
  }, []);

  // Handle product selection
  const handleProductSelect = useCallback(
    async (producto: any) => {
      if (!producto || !producto.CKId) return;

      // Auto-fill price based on payment type
      const precio =
        DOGPago === "CONTADO"
          ? Number(producto.CKPrecioPublico)
          : Number(producto.CKPrecioVenta1);
      const pesoPromedioKg = Number(producto.CKPesoPromedioKg ?? 0);

      setValue(`dispatchOrderU.${index}.DOUVrUnitario`, precio, {
        shouldValidate: true,
        shouldDirty: true,
      });

      // In manual mode, just save product info and wait for lot selection
      if (manualLotSelection === "MANUAL") {
        selectedProductRef.current = {
          CKId: producto.CKId,
          precio,
          pesoPromedioKg,
        };
        return;
      }

      // In automatic mode, add to DB immediately
      setIsAddingItem(true);
      try {
        const currentCantidad = cantidad || 1;
        const currentDescuento = descuento || 0;
        const currentTieneImpuesto = tieneImpuesto ?? true;
        const currentReservar = reservar ?? false;

        await addItemMutation.mutateAsync({
          orderId,
          secuencia,
          itemData: {
            DOUInvcaruniId: producto.CKId,
            DOUCantidad: currentCantidad,
            DOUVrUnitario: precio,
            DOUDescuento: currentDescuento,
            DOUTieneImpuesto: currentTieneImpuesto,
            DOULote: null,
            DOUNroDocumento: null,
            DOUModoSalida: manualLotSelection,
            DOUReservar: currentReservar,
          },
        });

        await queryClient.invalidateQueries({
          queryKey: dispatchOrderKeys.detail(secuencia),
        });

        // Retire the local draft row now that the server-backed item has been
        // synced in via the query. Without this the merge effect keeps the
        // draft (DOUId == null) AND appends the new server row → duplicate.
        onRemove(index);

        toast.success("Item added", {
          description: "Product has been added to the order",
        });
      } catch (error: any) {
        // Prefer the server-attributed field (e.g. insufficient stock →
        // DOUCantidad); fall back to the product selector for generic add errors.
        const errorMessage = applyItemServerError(
          error,
          form.setError,
          index,
          "DOUInvcaruniId",
          "Failed to add item",
        );
        toast.error("Error adding item", {
          description: errorMessage,
        });
      } finally {
        setIsAddingItem(false);
      }
    },
    [
      DOGPago,
      setValue,
      index,
      manualLotSelection,
      cantidad,
      descuento,
      tieneImpuesto,
      reservar,
      addItemMutation,
      orderId,
      secuencia,
      queryClient,
      form,
      onRemove,
    ],
  );

  // Handle lot selection in manual mode
  const handleLotSelectInManualMode = useCallback(
    async (selectedLoteObj: { lote: number; nroDocumento: string } | null) => {
      if (!selectedProductRef.current || !selectedLoteObj) return;
      if (itemExistsInDb) return;

      setIsAddingItem(true);
      try {
        const currentCantidad = cantidad || 1;
        const currentDescuento = descuento || 0;
        const currentTieneImpuesto = tieneImpuesto ?? true;
        const currentReservar = reservar ?? false;

        await addItemMutation.mutateAsync({
          orderId,
          secuencia,
          itemData: {
            DOUInvcaruniId: selectedProductRef.current.CKId,
            DOUCantidad: currentCantidad,
            DOUVrUnitario: selectedProductRef.current.precio,
            DOUDescuento: currentDescuento,
            DOUTieneImpuesto: currentTieneImpuesto,
            DOULote: selectedLoteObj.lote,
            DOUNroDocumento: selectedLoteObj.nroDocumento,
            DOUModoSalida: "MANUAL",
            DOUReservar: currentReservar,
          },
        });

        selectedProductRef.current = null;

        await queryClient.invalidateQueries({
          queryKey: dispatchOrderKeys.detail(secuencia),
        });

        // Retire the local draft row now that the server-backed item has been
        // synced in via the query. Without this the merge effect keeps the
        // draft (DOUId == null) AND appends the new server row → duplicate.
        onRemove(index);

        toast.success("Item added", {
          description: "Product has been added to the order",
        });
      } catch (error: any) {
        const errorMessage = error.message || "Failed to add item";
        form.setError(`dispatchOrderU.${index}.DOULote`, {
          type: "server",
          message: errorMessage,
        });
        toast.error("Error adding item", {
          description: errorMessage,
        });
      } finally {
        setIsAddingItem(false);
      }
    },
    [
      itemExistsInDb,
      cantidad,
      descuento,
      tieneImpuesto,
      reservar,
      addItemMutation,
      orderId,
      secuencia,
      queryClient,
      form,
      index,
      onRemove,
    ],
  );

  // Unified update handler
  const handleFieldUpdate = useCallback(
    async (
      fieldName:
        | "DOUCantidad"
        | "DOUVrUnitario"
        | "DOUDescuento"
        | "DOUTieneImpuesto"
        | "DOUReservar",
      newValue: any,
    ) => {
      if (!itemExistsInDb || !existingItem?.DOUId) return;

      // 0. Check for empty value explicitly (to prevent Zod coercing "" to 0)
      if (newValue === "" || newValue === null || newValue === undefined)
        return;

      // 1. Zod Validation & Parsing
      const validation = validateField(fieldName, newValue);
      if (!validation.success) {
        // Extract error message from Zod error
        const errorMessage =
          validation.error instanceof z.ZodError
            ? validation.error.issues[0]?.message || "Invalid value"
            : "Invalid value";

        // Set error on the specific field
        form.setError(`dispatchOrderU.${index}.${fieldName}` as any, {
          type: "validation",
          message: errorMessage,
        });

        // If invalid, just return (don't mutate).
        // The form already has the invalid value, so user sees what they typed.
        return;
      }

      // Clear any previous validation errors if validation passes
      form.clearErrors(`dispatchOrderU.${index}.${fieldName}` as any);

      const parsedValue = validation.data;

      // 2. Business Logic Checks
      if (fieldName === "DOUCantidad") {
        // If quantity is 0 or undefined, DO NOT mutate
        if (!parsedValue || parsedValue <= 0) return;
      }

      // For other numeric fields, if they are undefined/NaN (empty string input), DO NOT mutate
      // But 0 IS allowed for Price/Discount
      if (fieldName === "DOUVrUnitario" || fieldName === "DOUDescuento") {
        if (
          parsedValue === undefined ||
          parsedValue === null ||
          isNaN(parsedValue)
        )
          return;
      }

      // 3. Check if value actually changed from server
      const serverValue = existingItem[fieldName as keyof typeof existingItem];
      // Simple equality check (works for primitives)
      if (serverValue === parsedValue) return;

      setUpdatingFields((prev) => new Set(prev).add(fieldName));

      try {
        const updateData: any = {};
        updateData[fieldName] = parsedValue;

        // Clear warning when starting update
        if (fieldName === "DOUVrUnitario") {
          setPriceWarning(null);
        }

        const result = await updateItemMutation.mutateAsync({
          orderId,
          secuencia,
          itemId: existingItem.DOUId,
          updateData,
        });

        // Check for warnings
        if (result.warnings) {
          const priceWarningItem = result.warnings.find(
            (w) => w.field === "DOUVrUnitario",
          );
          if (priceWarningItem) {
            setPriceWarning(priceWarningItem.message);
          } else {
            setPriceWarning(null);
          }
        } else {
          setPriceWarning(null);
        }

        form.clearErrors(`dispatchOrderU.${index}.${fieldName}` as any);

        await queryClient.invalidateQueries({
          queryKey: dispatchOrderKeys.detail(secuencia),
        });
      } catch (error: any) {
        // Land the error on the field the server attributed it to (e.g. an
        // insufficient-stock error carries `fields: { DOUCantidad }`), falling
        // back to the field being edited when no field map is present.
        const errorMessage = applyItemServerError(
          error,
          form.setError,
          index,
          fieldName,
          "Failed to update field",
        );

        toast.error("Error updating field", {
          description: errorMessage,
        });
      } finally {
        setUpdatingFields((prev) => {
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      }
    },
    [
      itemExistsInDb,
      existingItem,
      validateField,
      updateItemMutation,
      orderId,
      secuencia,
      queryClient,
      form,
      index,
    ],
  );

  // Debounced update for numeric fields
  const handleDebouncedUpdate = useCallback(
    async (
      fieldName: "DOUCantidad" | "DOUVrUnitario" | "DOUDescuento",
      value: any,
    ) => {
      await handleFieldUpdate(fieldName, value);
    },
    [handleFieldUpdate],
  );

  // Setup debounced updates
  useDebouncedFieldUpdate({
    control,
    index,
    fieldName: "DOUCantidad",
    serverValue: existingItem?.DOUCantidad,
    itemExistsInDb,
    onUpdate: handleDebouncedUpdate,
    delayMs: 600,
  });

  useDebouncedFieldUpdate({
    control,
    index,
    fieldName: "DOUVrUnitario",
    serverValue: existingItem?.DOUVrUnitario,
    itemExistsInDb,
    onUpdate: handleDebouncedUpdate,
    delayMs: 600,
  });

  useDebouncedFieldUpdate({
    control,
    index,
    fieldName: "DOUDescuento",
    serverValue: existingItem?.DOUDescuento,
    itemExistsInDb,
    onUpdate: handleDebouncedUpdate,
    delayMs: 600,
  });

  // Handle item deletion
  const handleDelete = useCallback(async () => {
    if (!itemExistsInDb || !existingItem?.DOUId) {
      onRemove(index);
      return;
    }

    try {
      await deleteItemMutation.mutateAsync({
        orderId,
        secuencia,
        itemId: existingItem.DOUId,
      });

      await queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(secuencia),
      });

      toast.success("Item deleted", {
        description: "Item has been removed from the order",
      });
    } catch (error: any) {
      toast.error("Error deleting item", {
        description: error.message || "Failed to delete item",
      });
    }
  }, [
    itemExistsInDb,
    existingItem,
    deleteItemMutation,
    orderId,
    secuencia,
    queryClient,
    onRemove,
    index,
  ]);

  const isFieldUpdating = (fieldName: string) => updatingFields.has(fieldName);
  const avgWeightKg = Number(
    existingItem?.invcaruni?.CKPesoPromedioKg ??
      selectedProductRef.current?.pesoPromedioKg ??
      0,
  );
  const previewTotalWeightKg = avgWeightKg * Number(cantidad || 0);
  const totalWeightKg = Number(
    existingItem?.DOUPesoTotalKg ?? previewTotalWeightKg,
  );

  // Determinar qué mostrar según el modo y si está en DB
  // Modo automático: solo selector de productos (si no está en DB)
  // Modo manual: selector de productos + selector de lote (si no está en DB)
  // Si está en DB: mostrar todos los campos editables
  const showLotSelector = !itemExistsInDb && manualLotSelection === "MANUAL";
  const showEditableFields = itemExistsInDb;

  return (
    <TableRow key={field.id}>
      {/* Product Field */}
      <TableCell>
        {itemExistsInDb ? (
          <div className="flex items-center gap-2">
            {existingItem?.invcaruni?.CKDescripcion || "Unknown Product"}
            {isAddingItem && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        ) : (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOUInvcaruniId`}
            render={({ field: Controller }) => (
              <ProductoSelector
                showLabel
                field={Controller}
                initialProduct={null}
                onProductSelect={handleProductSelect}
              />
            )}
          />
        )}
      </TableCell>

      {/* Lot Field */}
      <TableCell>
        {showLotSelector ? (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOULote`}
            render={({ field: Controller }) => {
              const lotField = {
                value:
                  lote && nroDocumento ? { lote, nroDocumento } : undefined,
                onChange: (
                  value: { lote: number; nroDocumento: string } | undefined,
                ) => {
                  if (value) {
                    Controller.onChange(value.lote);
                    setValue(
                      `dispatchOrderU.${index}.DOUNroDocumento`,
                      value.nroDocumento,
                    );
                    if (selectedProductRef.current) {
                      handleLotSelectInManualMode(value);
                    }
                  } else {
                    Controller.onChange(null);
                    setValue(`dispatchOrderU.${index}.DOUNroDocumento`, null);
                  }
                },
              };

              return (
                <LotSelector
                  // @ts-expect-error lot field uses numeric composite keys
                  field={lotField}
                  productoId={productoId}
                  almacenId={almacenId ?? 0}
                  excludedLots={[]}
                  isLoadingAlmacen={loadingAlmacen}
                  disabled={isAddingItem}
                />
              );
            }}
          />
        ) : itemExistsInDb ? (
          <div className="text-sm text-muted-foreground">
            {existingItem?.DOULote
              ? `Lot ${existingItem.DOULote}${existingItem.DOUNroDocumento ? ` (Doc: ${existingItem.DOUNroDocumento})` : ""}`
              : "-"}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>

      {/* Quantity Input - Solo visible si está en DB */}
      <TableCell>
        {showEditableFields ? (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOUCantidad`}
            render={({ field, fieldState }) => (
              <Field>
                <div className="relative">
                  <NumericFormat
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue ?? null);
                    }}
                    placeholder="0,00"
                    disabled={isFieldUpdating("DOUCantidad")}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    customInput={Input}
                  />
                  {isFieldUpdating("DOUCantidad") && (
                    <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>

      {/* Unit Price Input - Solo visible si está en DB */}
      <TableCell>
        {showEditableFields ? (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOUVrUnitario`}
            render={({ field, fieldState }) => (
              <Field>
                <div className="relative">
                  <NumericFormat
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue ?? null);
                    }}
                    placeholder="0,00"
                    disabled={isFieldUpdating("DOUVrUnitario")}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    prefix="$"
                    customInput={Input}
                  />
                  {isFieldUpdating("DOUVrUnitario") && (
                    <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {priceWarning && (
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-500 mt-1">
                    ⚠️ {priceWarning}
                    {costoPromedio > 0 ? ` (${costoPromedio.toFixed(2)})` : ""}
                  </p>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>

      {/* Discount Input - Solo visible si está en DB */}
      <TableCell>
        {showEditableFields ? (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOUDescuento`}
            render={({ field, fieldState }) => (
              <Field>
                <div className="relative">
                  <NumericFormat
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.floatValue ?? null);
                    }}
                    placeholder="0,00"
                    disabled={isFieldUpdating("DOUDescuento")}
                    thousandSeparator="."
                    decimalSeparator=","
                    decimalScale={2}
                    customInput={Input}
                    suffix="%"
                  />
                  {isFieldUpdating("DOUDescuento") && (
                    <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin" />
                  )}
                </div>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>

      {/* Has VAT Checkbox - Solo visible si está en DB */}
      {/* <TableCell>
        {showEditableFields ? (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOUTieneImpuesto`}
            render={({ field: Controller }) => (
              <Field className="flex items-center justify-center">
                
                  <Checkbox
                    checked={Controller.value}
                    disabled={isFieldUpdating("DOUTieneImpuesto")}
                    onCheckedChange={(checked) => {
                      Controller.onChange(checked);
                      if (itemExistsInDb && existingItem?.DOUId) {
                        handleFieldUpdate("DOUTieneImpuesto", checked);
                      }
                    }}
                  />
                
              </Field>
            )}
          />
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell> */}

      {/* Reserve Checkbox - Solo visible si está en DB */}
      <TableCell>
        {showEditableFields ? (
          <Controller
            control={control}
            name={`dispatchOrderU.${index}.DOUReservar`}
            render={({ field: Controller }) => (
              <Field className="flex items-center justify-center">
                <Checkbox
                  checked={Controller.value ?? false}
                  disabled={isFieldUpdating("DOUReservar")}
                  onCheckedChange={(checked) => {
                    Controller.onChange(checked);
                    if (itemExistsInDb && existingItem?.DOUId) {
                      handleFieldUpdate("DOUReservar", checked);
                    }
                  }}
                />
              </Field>
            )}
          />
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>

      {/* Remove Button */}
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {formatWeightKg(avgWeightKg)}
        </div>
      </TableCell>

      <TableCell>
        <div className="text-sm text-muted-foreground">
          {formatWeightKg(totalWeightKg)}
        </div>
      </TableCell>

      <TableCell>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={deleteItemMutation.isPending}
        >
          {deleteItemMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}
