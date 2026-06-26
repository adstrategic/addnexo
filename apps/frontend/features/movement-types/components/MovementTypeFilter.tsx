import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface MovementTypeFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterChange?: (filter: string) => void;
}

export const MovementTypeFilter = ({
  searchTerm,
  onSearchChange,
  onFilterChange,
}: MovementTypeFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search movement types..."
          className="pl-8 w-[250px] md:w-[300px]"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};
