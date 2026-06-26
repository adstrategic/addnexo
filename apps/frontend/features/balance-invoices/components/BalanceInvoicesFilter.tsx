import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface BalanceInvoicesFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function BalanceInvoicesFilter({
  searchTerm,
  onSearchChange,
}: BalanceInvoicesFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by balance invoice number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
