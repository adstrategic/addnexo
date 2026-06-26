import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductActionProps {
  onOpenCreateModal: () => void;
}

export function ProductAction({ onOpenCreateModal }: ProductActionProps) {
  return (
    <Button
      onClick={onOpenCreateModal}
      className="w-full cursor-pointer sm:w-auto"
    >
      <Plus className="mr-2 size-4" aria-hidden />
      <span className="sm:inline">New Product</span>
    </Button>
  );
}
