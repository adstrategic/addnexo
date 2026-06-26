import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientActionsProps {
  onOpenCreateModal: () => void;
}

export function ClientActions({ onOpenCreateModal }: ClientActionsProps) {
  return (
    <Button
      onClick={onOpenCreateModal}
      className="w-full cursor-pointer sm:w-auto"
    >
      <Plus className="mr-2 size-4" aria-hidden />
      <span className="sm:inline">New Client</span>
    </Button>
  );
}
