"use client";

import { Check, ChevronsUpDown, Layers, Loader2 } from "lucide-react";
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
import { useGroupFilterSelector } from "./hooks/useGroupFilterSelector";
import type { Grupo } from "../types/server-types";

interface GroupFilterSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function GroupFilterSelector({
  value,
  onChange,
  placeholder = "All groups",
  className,
  disabled = false,
}: GroupFilterSelectorProps) {
  const {
    groupQuery,
    openGroups,
    groups,
    loadingGroups,
    isFetched,
    selectedGroup,
    handleGroupSearch,
    handleGroupSelect,
    toggleGroupPopover,
  } = useGroupFilterSelector(value);

  const handleSelect = (group: Grupo | null) => {
    onChange(group?.GId);
    handleGroupSelect(group);
  };

  const displayLabel = selectedGroup
    ? `${selectedGroup.GNro} - ${selectedGroup.GDescripcion}`
    : placeholder;

  return (
    <Popover open={openGroups} onOpenChange={toggleGroupPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openGroups}
          aria-label="Filter by group"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between gap-2 px-3 text-left font-normal sm:w-[220px]",
            !selectedGroup && "text-muted-foreground",
            className,
          )}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Layers className="size-4 shrink-0 opacity-60" aria-hidden />
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
            placeholder="Search group..."
            value={groupQuery}
            onValueChange={handleGroupSearch}
          />
          <CommandList>
            {(loadingGroups || isFetched) && (
              <CommandEmpty>
                {loadingGroups ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  "No groups found."
                )}
              </CommandEmpty>
            )}
            <CommandGroup className="max-h-64 overflow-auto">
              <CommandItem
                value="all-groups"
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
              {!loadingGroups &&
                groups.map((group) => (
                  <CommandItem
                    key={group.GId}
                    value={`${group.GNro} ${group.GDescripcion}`}
                    className="cursor-pointer"
                    onSelect={() => handleSelect(group)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === group.GId ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="font-medium">
                      {group.GNro} - {group.GDescripcion}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
