"use client";

import { Check, ChevronsUpDown, Loader2, Package } from "lucide-react";
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
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useProductFilterSelector } from "./hooks/useProductFilterSelector";
import type { Producto } from "@/features/catalog";

interface ProductFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ProductFilterSelector({
  value,
  onChange,
  placeholder = "All products",
  className,
  disabled = false,
}: ProductFilterSelectorProps) {
  const {
    productQuery,
    openProducts,
    products,
    loadingProducts,
    isFetched,
    selectedProduct,
    handleProductSearch,
    handleProductSelect,
    toggleProductPopover,
  } = useProductFilterSelector(value);

  const handleSelect = (product: Producto | null) => {
    onChange(product?.CKId);
    handleProductSelect(product);
  };

  const displayLabel = selectedProduct?.CKDescripcion ?? placeholder;

  return (
    <Popover open={openProducts} onOpenChange={toggleProductPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openProducts}
          aria-label="Filter by product"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedProduct && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Package className="size-4 shrink-0 opacity-60" aria-hidden />
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search product..."
            value={productQuery}
            onValueChange={handleProductSearch}
          />
          <CommandList>
            {(loadingProducts || isFetched) && (
              <CommandEmpty>
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No products found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-products"
                className="cursor-pointer"
                onSelect={() => handleSelect(null)}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    value == null ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
                {placeholder}
              </CommandItem>
              {!loadingProducts &&
                products.map((product) => (
                  <CommandItem
                    key={product.CKId}
                    value={product.CKDescripcion}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(product)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === product.CKId ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">{product.CKDescripcion}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
