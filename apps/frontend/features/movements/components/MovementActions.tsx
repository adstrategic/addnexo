"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MovementActionsProps {
  onOpenCreateModal: () => void;
  disabled?: boolean;
}

export function MovementActions({
  onOpenCreateModal,
  disabled = false,
}: MovementActionsProps) {
  return (
    <Button
      onClick={onOpenCreateModal}
      disabled={disabled}
      title={disabled ? "This period is closed" : undefined}
      className="w-full cursor-pointer sm:w-auto"
    >
      <Plus className="mr-2 size-4" aria-hidden />
      <span className="sm:inline">New Movement</span>
    </Button>
  );
}
