import { Input } from "@/components/ui/input";

import { Search } from "lucide-react";

interface ProductFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange?: (filter: string) => void;
}

export const ProductFilter = ({
  searchTerm,
  onSearchChange,
  // onFilterChange,
}: ProductFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="pl-8 w-[250px] md:w-[300px]"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onFilterChange?.("group")}>
            By group
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange?.("unit")}>
            By unit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onFilterChange?.("price")}>
            By price range
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </div>
  );
};
