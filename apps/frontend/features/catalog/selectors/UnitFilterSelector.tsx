"use client";

import { Check, ChevronsUpDown, Loader2, Ruler } from "lucide-react";
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
import { useUnitFilterSelector } from "./hooks/useUnitFilterSelector";
import type { Unidad } from "../types/server-types";

interface UnitFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UnitFilterSelector({
  value,
  onChange,
  placeholder = "All units",
  className,
  disabled = false,
}: UnitFilterSelectorProps) {
  const {
    unitQuery,
    openUnits,
    units,
    loadingUnits,
    isFetched,
    selectedUnit,
    handleUnitSearch,
    handleUnitSelect,
    toggleUnitPopover,
  } = useUnitFilterSelector(value);

  const handleSelect = (unit: Unidad | null) => {
    onChange(unit?.UMId);
    handleUnitSelect(unit);
  };

  const displayLabel = selectedUnit
    ? `${selectedUnit.UMNombre} - ${selectedUnit.UMDescripcion}`
    : placeholder;

  return (
    <Popover open={openUnits} onOpenChange={toggleUnitPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openUnits}
          aria-label="Filter by measurement unit"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedUnit && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Ruler className="size-4 shrink-0 opacity-60" aria-hidden />
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
            placeholder="Search unit..."
            value={unitQuery}
            onValueChange={handleUnitSearch}
          />
          <CommandList>
            {(loadingUnits || isFetched) && (
              <CommandEmpty>
                {loadingUnits ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No units found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-units"
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
              {!loadingUnits &&
                units.map((unit) => (
                  <CommandItem
                    key={unit.UMId}
                    value={`${unit.UMNombre} ${unit.UMDescripcion}`}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(unit)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === unit.UMId ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">
                      {unit.UMNombre} - {unit.UMDescripcion}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
