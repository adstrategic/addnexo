import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MovementTypeActionProps {
  onOpenCreateModal: () => void;
}

export const MovementTypeAction = ({
  onOpenCreateModal,
}: MovementTypeActionProps) => {
  return (
    <Button onClick={onOpenCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      New Movement Type
    </Button>
  );
};
