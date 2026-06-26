import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductActionProps {
  onOpenCreateModal: () => void;
}

export const ProductAction = ({ onOpenCreateModal }: ProductActionProps) => {
  return (
    <Button className="" onClick={onOpenCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      New Product
    </Button>
  );
};









