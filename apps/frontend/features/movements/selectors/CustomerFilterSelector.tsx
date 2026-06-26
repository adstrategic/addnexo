"use client";

import { Check, ChevronsUpDown, Loader2, Users } from "lucide-react";
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
import { useCustomerFilterSelector } from "./hooks/useCustomerFilterSelector";
import type { ClienteResponse } from "@/features/clients/schemas/ClientSchema";

interface CustomerFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomerFilterSelector({
  value,
  onChange,
  placeholder = "All customers",
  className,
  disabled = false,
}: CustomerFilterSelectorProps) {
  const {
    customerQuery,
    openCustomers,
    customers,
    loadingCustomers,
    isFetched,
    selectedCustomer,
    handleCustomerSearch,
    handleCustomerSelect,
    toggleCustomerPopover,
  } = useCustomerFilterSelector(value);

  const handleSelect = (customer: ClienteResponse | null) => {
    onChange(customer?.CId);
    handleCustomerSelect(customer);
  };

  const displayLabel = selectedCustomer?.CRazonSocial ?? placeholder;

  return (
    <Popover open={openCustomers} onOpenChange={toggleCustomerPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openCustomers}
          aria-label="Filter by customer"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedCustomer && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Users className="size-4 shrink-0 opacity-60" aria-hidden />
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
            placeholder="Search customer..."
            value={customerQuery}
            onValueChange={handleCustomerSearch}
          />
          <CommandList>
            {(loadingCustomers || isFetched) && (
              <CommandEmpty>
                {loadingCustomers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No customers found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-customers"
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
              {!loadingCustomers &&
                customers.map((customer) => (
                  <CommandItem
                    key={customer.CId}
                    value={customer.CRazonSocial}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === customer.CId ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">{customer.CRazonSocial}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
