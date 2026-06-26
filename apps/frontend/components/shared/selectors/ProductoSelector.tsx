"use client";

import { useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";

import { cn } from "@/lib/utils";
import { useProductSelector } from "./hooks/useProductSelector";
import type { Producto } from "@/features/catalog";

interface ProductoSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number | null) => void;
  };
  initialProduct: Producto | null;
  onProductSelect?: (producto: Producto) => void;
  grupoNro?: number;
  /** When set, only products whose origin country matches (catalog API). */
  paisId?: number;
  /** When true, render a FieldLabel (e.g. standalone form). Default false for table cells. */
  showLabel?: boolean;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  allowNone?: boolean;
}

export const ProductoSelector = ({
  field,
  initialProduct,
  onProductSelect,
  grupoNro,
  paisId,
  showLabel = false,
  label = "Product *",
  placeholder = "Select product...",
  searchPlaceholder = "Search product...",
  allowNone = false,
}: ProductoSelectorProps) => {
  const {
    productoQuery,
    openProductos,
    productos,
    loadingProductos,
    isFetched,
    selectedProducto,
    handleProductoSearch,
    handleProductoSelect,
    clearSelectedProducto,
    toggleProductoPopover,
  } = useProductSelector(initialProduct, {
    grupoNro,
    paisId,
  });

  const handleSelect = (producto: Producto | null) => {
    if (producto) {
      field.onChange(producto.CKId);
      handleProductoSelect(producto);
      onProductSelect?.(producto);
    } else {
      field.onChange(null);
      handleProductoSelect(null);
      toggleProductoPopover(false);
    }
  };

  useEffect(() => {
    const hasInvalidValue =
      field.value == null ||
      (typeof field.value === "number" && field.value <= 0);

    if (hasInvalidValue && selectedProducto) {
      clearSelectedProducto();
    }
  }, [field.value, selectedProducto, clearSelectedProducto]);

  const popover = (
    <Popover open={openProductos} onOpenChange={toggleProductoPopover}>
      <PopoverTrigger asChild>
        <div>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openProductos}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selectedProducto && "text-muted-foreground",
            )}
            type="button"
          >
            {selectedProducto
              ? selectedProducto.CKDescripcion
              : allowNone && !selectedProducto && field.value === null
                ? "None (Standalone Product)"
                : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={productoQuery}
            onValueChange={handleProductoSearch}
          />
          {(loadingProductos || isFetched) && (
            <CommandEmpty>
              {loadingProductos ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : (
                "No products found."
              )}
            </CommandEmpty>
          )}
          <CommandGroup className="max-h-64 overflow-auto">
            {allowNone && (
              <CommandItem value="none" onSelect={() => handleSelect(null)}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !selectedProducto ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="font-medium">None (Standalone Product)</span>
              </CommandItem>
            )}
            {!loadingProductos &&
              productos.map((producto) => (
                <CommandItem
                  key={producto.CKId}
                  value={producto.CKId.toString()}
                  onSelect={() => handleSelect(producto)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedProducto?.CKId === producto.CKId
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {producto.CKDescripcion}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Code: {producto.CKCodigo} | Origin:{" "}
                      {producto.origenPais?.nombre ?? "N/A"}
                    </span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );

  if (showLabel) {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <FieldContent>{popover}</FieldContent>
      </Field>
    );
  }

  return popover;
};
