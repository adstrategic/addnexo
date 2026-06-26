import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface SupplierActionsProps {
  onOpenCreateModal: () => void;
}

export const SupplierActions = ({
  onOpenCreateModal,
}: SupplierActionsProps) => {
  return (
    <Button onClick={onOpenCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      New Supplier
    </Button>
  );
};
