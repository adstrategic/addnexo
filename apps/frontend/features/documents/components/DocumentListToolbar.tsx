"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface DocumentListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function DocumentListToolbar({
  searchTerm,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
}: DocumentListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          aria-label="Search documents"
          placeholder="Search by number, client, or supplier..."
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

      {hasActiveFilters ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 cursor-pointer"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
