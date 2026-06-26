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
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useTipoMovimientoSelector } from "./hooks/useTipoMovimientoSelector";
import type { TipoMovimiento } from "@/features/movement-types";
import type { ControllerFieldState } from "react-hook-form";

interface TipoMovimientoSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  fieldState: ControllerFieldState;
  initialTipoMovimiento: TipoMovimiento | null;
  onTipoMovimientoSelect?: (tipo: TipoMovimiento) => void;
  label?: string;
}

const formatTipo = (tipo: TipoMovimiento) =>
  `${tipo.TTipo === 1 ? "📈" : "📉"} ${tipo.TAbreviatura}`;

export const TipoMovimientoSelector = ({
  field,
  fieldState,
  initialTipoMovimiento,
  onTipoMovimientoSelect,
  label = "Movement Type *",
}: TipoMovimientoSelectorProps) => {
  const {
    tipoQuery,
    openTipos,
    tipos,
    loadingTipos,
    isFetched,
    selectedTipo,
    handleTipoSearch,
    handleTipoSelect,
    toggleTipoPopover,
  } = useTipoMovimientoSelector(initialTipoMovimiento);

  // Función para manejar la selección
  const handleSelect = (tipo: TipoMovimiento) => {
    field.onChange(tipo.TId);
    handleTipoSelect(tipo);
    // Ejecutar callback si está definido
    onTipoMovimientoSelect?.(tipo);
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={openTipos} onOpenChange={toggleTipoPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openTipos}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedTipo && "text-muted-foreground",
              )}
              type="button"
            >
              {selectedTipo ? formatTipo(selectedTipo) : "Select type..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search movement type..."
              value={tipoQuery}
              onValueChange={handleTipoSearch}
            />
            {(loadingTipos || isFetched) && (
              <CommandEmpty>
                {loadingTipos ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No movement types found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!loadingTipos &&
                tipos.map((tipo) => (
                  <CommandItem
                    key={tipo.TId}
                    value={tipo.TId.toString()}
                    onSelect={() => handleSelect(tipo)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTipo?.TId === tipo.TId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <div>
                      <div className="font-medium">{formatTipo(tipo)}</div>
                      <div className="text-xs text-gray-500">
                        {tipo.TDescripcion}
                      </div>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  );
};
