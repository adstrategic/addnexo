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
import { useCiudadSelector } from "./hooks/useCiudadSelector";
import { type Ciudad } from "@/features/geography";
import type { ControllerFieldState } from "react-hook-form";

interface CiudadSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  fieldState: ControllerFieldState;
  initialCiudad: Ciudad | null;
  label?: string;
}

export const CiudadSelector = ({
  field,
  fieldState,
  initialCiudad,
  label = "City *",
}: CiudadSelectorProps) => {
  const {
    ciudadQuery,
    openCiudades,
    ciudades,
    loadingCiudades,
    isFetched,
    hasUserInteracted,
    selectedCiudad,
    handleCiudadSearch,
    handleCiudadSelect,
    toggleCiudadPopover,
  } = useCiudadSelector(initialCiudad);

  // Función para manejar la selección
  const handleSelect = (ciudad: Ciudad) => {
    field.onChange(ciudad.id);
    handleCiudadSelect(ciudad);
  };

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Popover open={openCiudades} onOpenChange={toggleCiudadPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCiudades}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedCiudad && "text-muted-foreground",
              )}
              type="button"
            >
              {selectedCiudad
                ? `${selectedCiudad.nombre}, ${selectedCiudad.estado.nombre}, ${selectedCiudad.estado.pais.nombre}`
                : "Select city..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search city..."
              value={ciudadQuery}
              onValueChange={handleCiudadSearch}
            />
            {(loadingCiudades || isFetched) && (
              <CommandEmpty>
                {loadingCiudades ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No cities found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>Type to search for a city...</CommandItem>
              )}

              {!loadingCiudades &&
                ciudades.map((ciudad) => (
                  <CommandItem
                    key={ciudad.id}
                    value={ciudad.id.toString()}
                    onSelect={() => handleSelect(ciudad)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCiudad?.id === ciudad.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <div>
                      <div className="font-medium">{ciudad.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {ciudad.estado.nombre}, {ciudad.estado.pais.nombre}
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
