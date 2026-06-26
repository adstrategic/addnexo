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
import { useProveedorSelector } from "./hooks/useProveedorSelector";
import type { SupplierResponse } from "@/features/suppliers";
import type { ControllerFieldState } from "react-hook-form";

interface ProveedorSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  initialSupplier: SupplierResponse | null;
  fieldState: ControllerFieldState;
  /** Called after a supplier is chosen (e.g. to read origin country). */
  onSupplierSelect?: (supplier: SupplierResponse) => void;
}

export const ProveedorSelector = ({
  field,
  fieldState,
  initialSupplier,
  onSupplierSelect,
}: ProveedorSelectorProps) => {
  const {
    proveedorQuery,
    openProveedores,
    proveedores,
    loadingProveedores,
    hasUserInteracted,
    isFetched,
    selectedProveedor,
    handleProveedorSearch,
    handleProveedorSelect,
    toggleProveedorPopover,
  } = useProveedorSelector(initialSupplier);

  // Función para manejar la selección
  const handleSelect = (proveedor: SupplierResponse) => {
    field.onChange(proveedor.MPId);
    handleProveedorSelect(proveedor);
    onSupplierSelect?.(proveedor);
  };

  return (
    <Field>
      <FieldLabel>Supplier *</FieldLabel>
      <Popover open={openProveedores} onOpenChange={toggleProveedorPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openProveedores}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedProveedor && "text-muted-foreground",
              )}
              type="button"
            >
              {selectedProveedor
                ? selectedProveedor.MPDescripcion
                : "Select supplier..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search supplier..."
              value={proveedorQuery}
              onValueChange={handleProveedorSearch}
            />
            {(loadingProveedores || isFetched) && (
              <CommandEmpty>
                {loadingProveedores ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No suppliers found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>
                  Type to search for a supplier...
                </CommandItem>
              )}
              {!loadingProveedores &&
                proveedores.map((proveedor) => (
                  <CommandItem
                    key={proveedor.MPId}
                    value={proveedor.MPId.toString()}
                    onSelect={() => handleSelect(proveedor)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedProveedor?.MPId === proveedor.MPId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {proveedor.MPDescripcion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        NIT: {proveedor.MPNro}
                      </span>
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
