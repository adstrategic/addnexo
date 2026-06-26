// Icons
import { Search } from "lucide-react";

// UI Components
import { Input } from "@/components/ui/input";

interface VendedorFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function VendedorFilters({
  searchTerm,
  onSearchChange,
}: VendedorFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, NIT/Cedula, phone, or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      {/* TODO: add filters */}
      {/* <div className="flex gap-2 items-center">
        <Select onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div> */}
    </div>
  );
}
