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
import { useGroupSelector } from "./hooks/useGroupSelector";
import { Grupo } from "../types/server-types";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

interface GroupSelectorProps {
  field: {
    value: number | undefined;
    onChange: (value: number) => void;
  };
  initialGroup: Grupo | null;
  onGroupSelect?: (group: Grupo) => void;
  disabled?: boolean;
}

export const GroupSelector = ({
  field,
  initialGroup,
  onGroupSelect,
  disabled = false,
}: GroupSelectorProps) => {
  const {
    groupQuery,
    openGroups,
    groups,
    loadingGroups,
    hasUserInteracted,
    isFetched,
    selectedGroup,
    handleGroupSearch,
    handleGroupSelect,
    toggleGroupPopover,
  } = useGroupSelector(initialGroup);

  // Función para manejar la selección
  const handleSelect = (group: Grupo) => {
    field.onChange(group.GId);
    handleGroupSelect(group);
    // Ejecutar callback si está definido
    onGroupSelect?.(group);
  };

  return (
    <Field>
      <FieldLabel>Group *</FieldLabel>
      <Popover open={openGroups} onOpenChange={toggleGroupPopover}>
        <PopoverTrigger asChild>
          <FieldContent>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openGroups}
              className={cn(
                "w-full justify-between text-left font-normal",
                !selectedGroup && "text-muted-foreground",
              )}
              type="button"
              disabled={disabled}
            >
              {selectedGroup
                ? `${selectedGroup.GNro} - ${selectedGroup.GDescripcion}`
                : "Select group..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </FieldContent>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search group..."
              value={groupQuery}
              onValueChange={handleGroupSearch}
            />
            {(loadingGroups || isFetched) && (
              <CommandEmpty>
                {loadingGroups ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No groups found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              {!hasUserInteracted && (
                <CommandItem disabled>
                  Type to search for a group...
                </CommandItem>
              )}
              {!loadingGroups &&
                groups.map((group) => (
                  <CommandItem
                    key={group.GId}
                    value={`${group.GNro} ${group.GDescripcion}`}
                    onSelect={() => handleSelect(group)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedGroup?.GId === group.GId
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {group.GNro} - {group.GDescripcion}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {/* <FormMessage /> */}
    </Field>
  );
};
