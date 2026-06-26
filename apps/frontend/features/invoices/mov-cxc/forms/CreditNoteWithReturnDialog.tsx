"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toDateOnly } from "@/lib/dateUtils";
import { Loader2, CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  movCxcApi,
  type InvoiceReturnableItem,
} from "../services/mov-cxc.service";
import { invoiceKeys } from "../../services/invoices.api";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { CreditNoteWithReturnFormData } from "../schemas/mov-cxc-schema";
import { NumericFormat } from "react-number-format";
import { numericFormatSelectAllIfZero } from "@/lib/numeric-format";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";

interface CreditNoteWithReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  form: UseFormReturn<CreditNoteWithReturnFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  invoiceCreatedAt?: Date | null;
}

export function CreditNoteWithReturnDialog({
  open,
  onOpenChange,
  invoiceId,
  form,
  onSubmit,
  isLoading = false,
  invoiceCreatedAt,
}: CreditNoteWithReturnDialogProps) {
  const [returnQuantities, setReturnQuantities] = useState<
    Record<number, number>
  >({});

  // Fetch available items for return
  const { data: items, isLoading: isLoadingItems } = useQuery<
    InvoiceReturnableItem[]
  >({
    queryKey: [
      ...invoiceKeys.detail(invoiceId),
      "credit-note",
      "items-disponibles",
    ],
    queryFn: () => movCxcApi.obtenerItemsInvoiceParaDevolucion(invoiceId),
    enabled: open && invoiceId > 0,
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setReturnQuantities({});
    }
  }, [open]);

  const handleQuantityChange = (FUId: number, cantidad: number) => {
    const item = items?.find((i) => i.FUId === FUId);
    if (!item) return;

    // Validate that it doesn't exceed available quantity
    if (cantidad > item.cantidadDisponible) {
      toast.error(`Quantity cannot exceed ${item.cantidadDisponible}`);
    }

    setReturnQuantities((prev) => ({
      ...prev,
      [FUId]: cantidad,
    }));

    // Update form items array
    const currentItems = form.getValues("items") || [];
    const itemIndex = currentItems.findIndex((i) => i.FUId === FUId);

    if (cantidad > 0) {
      if (itemIndex >= 0) {
        // Update existing item
        currentItems[itemIndex] = { FUId, cantidad };
      } else {
        // Add new item
        currentItems.push({ FUId, cantidad });
      }
    } else {
      // Remove item if quantity is 0
      if (itemIndex >= 0) {
        currentItems.splice(itemIndex, 1);
      }
    }

    form.setValue("items", currentItems);
  };

  const handleFormSubmit = async (e?: React.BaseSyntheticEvent) => {
    // Filter only items with quantity > 0
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([FUId, cantidad]) => ({
        FUId: Number(FUId),
        cantidad,
      }));

    if (itemsToReturn.length === 0) {
      toast.error(
        "You must select at least one item with quantity greater than 0",
      );
      return;
    }

    form.setValue("items", itemsToReturn);
    await onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Create Credit Note with Inventory Return</DialogTitle>
          <DialogDescription>
            Select the quantity to return for each item. Inventory movements
            will be created upon confirmation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-4">
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
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* Items Table */}
          {isLoadingItems ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                Loading items...
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {!items || items.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No items available for return
                </p>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Lot</TableHead>
                        <TableHead className="text-right">
                          Original Quantity
                        </TableHead>
                        <TableHead className="text-right">
                          Already Returned
                        </TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">
                          Quantity to Return
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.FUId}>
                          <TableCell className="font-medium">
                            {item.producto.CKDescripcion}
                          </TableCell>
                          <TableCell>{item.lote}</TableCell>
                          <TableCell className="text-right">
                            {item.cantidadOriginal}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.cantidadYaDevuelta}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.cantidadDisponible}
                          </TableCell>
                          <TableCell>
                            <NumericFormat
                              value={returnQuantities[item.FUId] || 0}
                              onValueChange={(values) => {
                                handleQuantityChange(
                                  item.FUId,
                                  values.floatValue || 0,
                                );
                              }}
                              min={0}
                              max={item.cantidadDisponible}
                              disabled={isLoading}
                              placeholder="0,00"
                              thousandSeparator="."
                              decimalSeparator=","
                              customInput={Input}
                              {...numericFormatSelectAllIfZero(
                                returnQuantities[item.FUId] || 0,
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !items || items.length === 0 || isLoadingItems
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Credit Note with Return"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
