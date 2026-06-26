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
import { useVendedorSelector } from "./hooks/useVendedorSelector";
import type { VendorResponse } from "@/features/vendors";
import type { ControllerFieldState } from "react-hook-form";

interface VendedorSelectorProps {
  field: {
    value: number | null;
    onChange: (value: number | null) => void;
  };
  initialVendor: VendorResponse | null;
  fieldState: ControllerFieldState;
}

export const VendedorSelector = ({
  field,
  initialVendor,
  fieldState,
}: VendedorSelectorProps) => {
  const {
    vendedorQuery,
    openVendedores,
    vendedores,
    loadingVendedores,
    isFetched,
    hasUserInteracted,
    selectedVendedor,
    handleVendedorSearch,
    toggleVendedorPopover,
    handleVendedorSelect,
  } = useVendedorSelector(initialVendor);

  const handleSelect = (vendedor: VendorResponse) => {
    field.onChange(vendedor.VId);
    handleVendedorSelect(vendedor);
  };

  return (
    <Field>
      <FieldLabel>Vendor</FieldLabel>
      <Popover open={openVendedores} onOpenChange={toggleVendedorPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openVendedores}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedVendedor && "text-muted-foreground",
              )}
              type="button"
            >
              {selectedVendedor ? selectedVendedor.VNombre : "Select vendor"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search vendor..."
              value={vendedorQuery}
              onValueChange={handleVendedorSearch}
            />
            {(loadingVendedores || isFetched) && (
              <CommandEmpty>
                {loadingVendedores ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No vendors found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {/* {!loadingVendedores && (
                <CommandItem value="none" onSelect={handleSelectNone}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      !selectedVendedor ? "opacity-100" : "opacity-0"
                    )}
                  />
                  None
                </CommandItem>
              )} */}

              {!hasUserInteracted && (
                <CommandItem disabled>
                  Type to search for a vendor...
                </CommandItem>
              )}

              {!loadingVendedores &&
                vendedores.map((v) => (
                  <CommandItem
                    key={v.VId}
                    value={v.VId.toString()}
                    onSelect={() => handleSelect(v)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedVendedor?.VId === v.VId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {v.VNombre}
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
