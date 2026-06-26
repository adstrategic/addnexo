import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AlmacenActionsProps {
  onOpenCreateModal: () => void;
}

export function AlmacenActions({ onOpenCreateModal }: AlmacenActionsProps) {
  return (
    <Button onClick={onOpenCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      New Warehouse
    </Button>
  );
}

