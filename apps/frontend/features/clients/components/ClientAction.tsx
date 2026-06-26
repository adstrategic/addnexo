import { Button } from "@/components/ui/button";
import { Plus, Download, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientActionsProps {
  onOpenCreateModal: () => void;
}

export function ClientActions({ onOpenCreateModal }: ClientActionsProps) {
  return (
    <div className="flex gap-2">
      {/* Primary Action - Create Client */}
      <Button onClick={onOpenCreateModal} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Client
      </Button>

      {/* Secondary Actions */}
      {/* TODO: Implement export and import functionality */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Clients
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import Clients
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </div>
  );
}
