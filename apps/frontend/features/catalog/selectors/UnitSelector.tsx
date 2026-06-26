"use client";

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

import { cn } from "@/lib/utils";
import { useUnitSelector } from "./hooks/useUnitSelector";
import { Unidad } from "../types/server-types";
import {
  Field,
  FieldContent,
  FieldLabel,
} from "@/components/ui/field";

interface UnitSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  initialUnit: Unidad | null;
  onUnitSelect?: (unit: Unidad) => void;
  disabled?: boolean;
}

export const UnitSelector = ({
  field,
  initialUnit,
  onUnitSelect,
  disabled = false,
}: UnitSelectorProps) => {
  const {
    unitQuery,
    openUnits,
    units,
    loadingUnits,
    hasUserInteracted,
    isFetched,
    selectedUnit,
    handleUnitSearch,
    handleUnitSelect,
    toggleUnitPopover,
  } = useUnitSelector(initialUnit);

  // Función para manejar la selección
  const handleSelect = (unit: Unidad) => {
    field.onChange(unit.UMId);
    handleUnitSelect(unit);
    // Ejecutar callback si está definido
    onUnitSelect?.(unit);
  };

  return (
    <Field>
      <FieldLabel>Unit *</FieldLabel>
      <Popover open={openUnits} onOpenChange={toggleUnitPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openUnits}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedUnit && "text-muted-foreground",
              )}
              type="button"
              disabled={disabled}
            >
              {selectedUnit
                ? `${selectedUnit.UMNombre} - ${selectedUnit.UMDescripcion}`
                : "Select unit..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search unit..."
              value={unitQuery}
              onValueChange={handleUnitSearch}
            />
            {(loadingUnits || isFetched) && (
              <CommandEmpty>
                {loadingUnits ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No units found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>Type to search for a unit...</CommandItem>
              )}
              {!loadingUnits &&
                units.map((unit) => (
                  <CommandItem
                    key={unit.UMId}
                    value={`${unit.UMNombre} ${unit.UMDescripcion}`}
                    onSelect={() => handleSelect(unit)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUnit?.UMId === unit.UMId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {unit.UMNombre} - {unit.UMDescripcion}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
};
