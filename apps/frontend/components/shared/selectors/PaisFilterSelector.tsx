"use client";

import { Check, ChevronsUpDown, Globe, Loader2 } from "lucide-react";
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
import { usePaisFilterSelector } from "./hooks/usePaisFilterSelector";
import type { PaisOption } from "@/features/geography/hooks/usePaisesSearch";

interface PaisFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PaisFilterSelector({
  value,
  onChange,
  placeholder = "All countries",
  className,
  disabled = false,
}: PaisFilterSelectorProps) {
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
  } = usePaisFilterSelector(value);

  const handleSelect = (pais: PaisOption | null) => {
    onChange(pais?.id);
    handlePaisSelect(pais);
  };

  const displayLabel = selectedPais?.nombre ?? placeholder;

  return (
    <Popover open={openPaises} onOpenChange={togglePaisPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openPaises}
          aria-label="Filter by country"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedPais && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe className="size-4 shrink-0 opacity-60" aria-hidden />
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
            placeholder="Search country..."
            value={paisQuery}
            onValueChange={handlePaisSearch}
          />
          <CommandList>
            {(loadingPaises || isFetched) && (
              <CommandEmpty>
                {loadingPaises ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No countries found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-countries"
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
              {!loadingPaises &&
                paises.map((pais) => (
                  <CommandItem
                    key={pais.id}
                    value={pais.id.toString()}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(pais)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === pais.id ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">{pais.nombre}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
