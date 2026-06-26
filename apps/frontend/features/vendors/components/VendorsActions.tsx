import { Plus } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";

interface VendedorActionsProps {
  onOpenCreateModal: () => void;
}

export function VendedorActions({ onOpenCreateModal }: VendedorActionsProps) {
  return (
    <Button
      onClick={onOpenCreateModal}
      className="w-full cursor-pointer sm:w-auto"
    >
      <Plus className="mr-2 size-4" aria-hidden />
      <span className="sm:inline">New Vendor</span>
    </Button>
  );
}
