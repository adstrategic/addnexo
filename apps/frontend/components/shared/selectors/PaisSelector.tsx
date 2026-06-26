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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { usePaisSelector } from "./hooks/usePaisSelector";
import type { PaisOption } from "@/features/geography/hooks/usePaisesSearch";

interface PaisSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  initialPais: PaisOption | null;
  label?: string;
  disabled?: boolean;
}

export const PaisSelector = ({
  field,
  initialPais,
  label = "Origin country *",
  disabled = false,
}: PaisSelectorProps) => {
  const {
    paisQuery,
    openPaises,
    paises,
    loadingPaises,
    isFetched,
    selectedPais,
    handlePaisSearch,
    handlePaisSelect,
    togglePaisPopover,
  } = usePaisSelector(initialPais);

  const handleSelect = (pais: PaisOption) => {
    field.onChange(pais.id);
    handlePaisSelect(pais);
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={openPaises} onOpenChange={togglePaisPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openPaises}
              disabled={disabled}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedPais && "text-muted-foreground",
              )}
              type="button"
            >
              {selectedPais ? selectedPais.nombre : "Select country..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search country..."
              value={paisQuery}
              onValueChange={handlePaisSearch}
            />
            {(loadingPaises || isFetched) && (
              <CommandEmpty>
                {loadingPaises ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No countries found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!loadingPaises &&
                paises.map((pais) => (
                  <CommandItem
                    key={pais.id}
                    value={pais.id.toString()}
                    onSelect={() => handleSelect(pais)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedPais?.id === pais.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <span className="font-medium">{pais.nombre}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
};
