"use client";

import { Check, ChevronsUpDown, Loader2, UserRound } from "lucide-react";
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
import { useVendorFilterSelector } from "./hooks/useVendorFilterSelector";
import type { VendorResponse } from "../schemas/VendorSchema";

interface VendorFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function VendorFilterSelector({
  value,
  onChange,
  placeholder = "All vendors",
  className,
  disabled = false,
}: VendorFilterSelectorProps) {
  const {
    vendorQuery,
    openVendors,
    vendors,
    loadingVendors,
    isFetched,
    selectedVendor,
    handleVendorSearch,
    handleVendorSelect,
    toggleVendorPopover,
  } = useVendorFilterSelector(value);

  const handleSelect = (vendor: VendorResponse | null) => {
    onChange(vendor?.VId);
    handleVendorSelect(vendor);
  };

  const displayLabel = selectedVendor?.VNombre ?? placeholder;

  return (
    <Popover open={openVendors} onOpenChange={toggleVendorPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openVendors}
          aria-label="Filter by vendor"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedVendor && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className="size-4 shrink-0 opacity-60" aria-hidden />
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
            placeholder="Search vendor..."
            value={vendorQuery}
            onValueChange={handleVendorSearch}
          />
          <CommandList>
            {(loadingVendors || isFetched) && (
              <CommandEmpty>
                {loadingVendors ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No vendors found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-vendors"
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
              {!loadingVendors &&
                vendors.map((vendor) => (
                  <CommandItem
                    key={vendor.VId}
                    value={vendor.VNombre}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(vendor)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === vendor.VId ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">{vendor.VNombre}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
