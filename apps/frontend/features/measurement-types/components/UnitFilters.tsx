"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UnitFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange?: (filter: string) => void;
}

export function UnitFilters({
  searchTerm,
  onSearchChange,
}: UnitFiltersProps) {
  return (
    <div className="relative mb-4 sm:mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search units..."
        className="pl-10 w-full max-w-[300px]"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
