"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { PaisFilterSelector } from "@/components/shared/selectors/PaisFilterSelector";

interface SupplierListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  countryId?: number;
  onCountryChange: (value: number | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isFetching?: boolean;
  totalItems?: number;
}

export function SupplierListToolbar({
  searchTerm,
  onSearchChange,
  countryId,
  onCountryChange,
  onClearFilters,
  hasActiveFilters,
}: SupplierListToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            inputMode="search"
            autoComplete="off"
            role="searchbox"
            aria-label="Search suppliers"
            placeholder="Search by name, NIT, contact, city, or country..."
            className="h-10 w-full pr-10 pl-9"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchTerm ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2 cursor-pointer"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PaisFilterSelector
            value={countryId}
            onChange={onCountryChange}
            placeholder="All countries"
          />

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
