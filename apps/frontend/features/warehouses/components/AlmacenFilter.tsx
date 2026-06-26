"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AlmacenFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function AlmacenFilters({
  searchTerm,
  onSearchChange,
}: AlmacenFiltersProps) {
  return (
    <div className="relative mb-4 sm:mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search warehouses…"
        className="pl-10 w-full max-w-[300px]"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}

