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
import { useClienteSelector } from "./hooks/useClienteSelector";
import type { ClienteResponse } from "@/features/clients/schemas/ClientSchema";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { ControllerFieldState } from "react-hook-form";

interface ClienteSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  fieldState: ControllerFieldState;
  initialClient: ClienteResponse | null;
  onClienteSelect?: (cliente: ClienteResponse) => void;
}

export const ClienteSelector = ({
  field,
  fieldState,
  initialClient,
  onClienteSelect,
}: ClienteSelectorProps) => {
  const {
    clienteQuery,
    openClientes,
    clientes,
    loadingClientes,
    hasUserInteracted,
    isFetched,
    selectedCliente,
    handleClienteSearch,
    handleClienteSelect,
    toggleClientePopover,
  } = useClienteSelector(initialClient);

  // Función para manejar la selección
  const handleSelect = (cliente: ClienteResponse) => {
    field.onChange(cliente.CId);
    handleClienteSelect(cliente);
    // Ejecutar callback si está definido
    onClienteSelect?.(cliente);
  };

  return (
    <Field>
      <FieldLabel>Customer *</FieldLabel>
      <Popover open={openClientes} onOpenChange={toggleClientePopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openClientes}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedCliente && "text-muted-foreground",
              )}
              type="button"
            >
              {selectedCliente
                ? selectedCliente.CRazonSocial
                : "Select customer..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search customer..."
              value={clienteQuery}
              onValueChange={handleClienteSearch}
            />
            {(loadingClientes || isFetched) && (
              <CommandEmpty>
                {loadingClientes ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No customers found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>
                  Type to search for a customer...
                </CommandItem>
              )}
              {!loadingClientes &&
                clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.CId}
                    value={cliente.CId.toString()}
                    onSelect={() => handleSelect(cliente)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCliente?.CId === cliente.CId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {cliente.CRazonSocial}
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
