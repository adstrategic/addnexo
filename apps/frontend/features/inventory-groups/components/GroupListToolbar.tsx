"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface GroupListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function GroupListToolbar({
  searchTerm,
  onSearchChange,
}: GroupListToolbarProps) {
  return (
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
        aria-label="Search inventory groups"
        placeholder="Search by number or description..."
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
  );
}
