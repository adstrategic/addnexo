// Icons
import { Plus } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

interface VendedorActionsProps {
  onOpenCreateModal: () => void;
}

export function VendedorActions({ onOpenCreateModal }: VendedorActionsProps) {
  return (
    <div className="flex gap-2">
      {/* Primary Action - Create Vendedor */}
      <Button onClick={onOpenCreateModal} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Vendor
      </Button>

      {/* Secondary Actions */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Vendors
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import Vendors
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </div>
  );
}
