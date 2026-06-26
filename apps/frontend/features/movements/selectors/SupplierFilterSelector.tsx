"use client";

import { Check, ChevronsUpDown, Loader2, Truck } from "lucide-react";
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
import { useSupplierFilterSelector } from "./hooks/useSupplierFilterSelector";
import type { SupplierResponse } from "@/features/suppliers";

interface SupplierFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SupplierFilterSelector({
  value,
  onChange,
  placeholder = "All suppliers",
  className,
  disabled = false,
}: SupplierFilterSelectorProps) {
  const {
    supplierQuery,
    openSuppliers,
    suppliers,
    loadingSuppliers,
    isFetched,
    selectedSupplier,
    handleSupplierSearch,
    handleSupplierSelect,
    toggleSupplierPopover,
  } = useSupplierFilterSelector(value);

  const handleSelect = (supplier: SupplierResponse | null) => {
    onChange(supplier?.MPId);
    handleSupplierSelect(supplier);
  };

  const displayLabel = selectedSupplier?.MPDescripcion ?? placeholder;

  return (
    <Popover open={openSuppliers} onOpenChange={toggleSupplierPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openSuppliers}
          aria-label="Filter by supplier"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedSupplier && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Truck className="size-4 shrink-0 opacity-60" aria-hidden />
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
            placeholder="Search supplier..."
            value={supplierQuery}
            onValueChange={handleSupplierSearch}
          />
          <CommandList>
            {(loadingSuppliers || isFetched) && (
              <CommandEmpty>
                {loadingSuppliers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No suppliers found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-suppliers"
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
              {!loadingSuppliers &&
                suppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.MPId}
                    value={supplier.MPDescripcion}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(supplier)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === supplier.MPId ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">{supplier.MPDescripcion}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
