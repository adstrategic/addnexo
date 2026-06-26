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
import { useBankSelector } from "./hooks/useBankSelector";
import type { BankResponse } from "@/features/banks/schemas/BankSchema";

interface BankSelectorProps {
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
  initialBank?: BankResponse | null;
  onBankSelect?: (bank: BankResponse) => void;
}

export const BankSelector = ({
  value,
  onChange,
  disabled = false,
  initialBank = null,
  onBankSelect,
}: BankSelectorProps) => {
  const {
    bankQuery,
    openBanks,
    banks,
    loadingBanks,
    hasUserInteracted,
    isFetched,
    selectedBank,
    handleBankSearch,
    handleBankSelect,
    toggleBankPopover,
  } = useBankSelector(initialBank);

  // Función para manejar la selección
  const handleSelect = (bank: BankResponse) => {
    onChange(bank.BId);
    handleBankSelect(bank);
    // Ejecutar callback si está definido
    onBankSelect?.(bank);
  };

  return (
    <Popover open={openBanks} onOpenChange={toggleBankPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openBanks}
          className={cn(
            "w-full justify-between text-left font-normal",
            !selectedBank && "text-muted-foreground",
          )}
          type="button"
          disabled={disabled}
        >
          {selectedBank && (selectedBank.BId === value || value === undefined)
            ? selectedBank.BNombre
            : "Select bank..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search bank..."
            value={bankQuery}
            onValueChange={handleBankSearch}
          />
          {(loadingBanks || isFetched) && (
            <CommandEmpty>
              {loadingBanks ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              ) : (
                "No banks found."
              )}
            </CommandEmpty>
          )}
          <CommandGroup className="max-h-64 overflow-auto">
            {!hasUserInteracted && (
              <CommandItem disabled>Type to search for a bank...</CommandItem>
            )}
            {!loadingBanks &&
              banks.map((bank) => (
                <CommandItem
                  key={bank.BId}
                  value={bank.BId.toString()}
                  onSelect={() => handleSelect(bank)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedBank?.BId === bank.BId
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {bank.BNombre}
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
