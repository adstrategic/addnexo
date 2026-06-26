"use client";

import { useMemo, useState } from "react";
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
import { Field, FieldContent } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useLotesDisponibles } from "@/features/movements/hooks/useLotesDisponibles";

interface LotSelectorProps {
  field: {
    value: { lote: string; nroDocumento: string } | undefined;
    onChange: (value: { lote: string; nroDocumento: string } | undefined) => void;
  };
  productoId?: number;
  almacenId?: number;
  excludedLots?: { lote: string; nroDocumento: string }[];
  disabled?: boolean;
}

export function LotSelector({
  field,
  productoId,
  almacenId,
  excludedLots = [],
  disabled = false,
}: LotSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: lotesDisponibles = [], isLoading } = useLotesDisponibles({
    productoId,
    almacenId,
    enabled: !!productoId && !!almacenId,
  });

  const lotesFiltrados = useMemo(() => {
    const availableLots = lotesDisponibles.filter((lote) => {
      const isExcluded = excludedLots.some(
        (excluded) =>
          excluded.lote === lote.KLLote &&
          excluded.nroDocumento === lote.KLNroDocumento,
      );
      const isCurrentSelection =
        field.value?.lote === lote.KLLote &&
        field.value?.nroDocumento === lote.KLNroDocumento;
      return !isExcluded || isCurrentSelection;
    });

    if (!searchQuery) return availableLots;

    const search = searchQuery.toLowerCase();
    return availableLots.filter(
      (lote) =>
        lote.KLLote.toString().includes(searchQuery) ||
        lote.KLNroDocumento.toLowerCase().includes(search),
    );
  }, [excludedLots, field.value, lotesDisponibles, searchQuery]);

  const selectedLote = useMemo(
    () =>
      lotesDisponibles.find(
        (lote) =>
          lote.KLLote === field.value?.lote &&
          lote.KLNroDocumento === field.value?.nroDocumento,
      ) ?? null,
    [field.value, lotesDisponibles],
  );

  const isDisabled =
    disabled || !productoId || !almacenId || isLoading || lotesFiltrados.length === 0;

  return (
    <Field>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSearchQuery("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedLote && "text-muted-foreground",
              )}
              type="button"
              disabled={isDisabled}
            >
              {selectedLote
                ? `Lot ${selectedLote.KLLote} (Doc: ${selectedLote.KLNroDocumento})`
                : "Select lot..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search lot or document..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : (
                "No lots found."
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {lotesFiltrados.map((lote) => (
                <CommandItem
                  key={lote.KLId}
                  value={lote.KLId.toString()}
                  onSelect={() => {
                    field.onChange({
                      lote: lote.KLLote,
                      nroDocumento: lote.KLNroDocumento,
                    });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedLote?.KLId === lote.KLId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      Lot {lote.KLLote} (Doc: {lote.KLNroDocumento})
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Available: {Number(lote.KLExistenciaFin).toFixed(2)} · Cost: $
                      {Number(lote.KLCostoPromedio).toFixed(2)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  );
}
