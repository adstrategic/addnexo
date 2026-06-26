"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface GroupActionsProps {
  onOpenCreateModal: () => void;
}

export function GroupActions({ onOpenCreateModal }: GroupActionsProps) {
  return (
    <Button onClick={onOpenCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      New Group
    </Button>
  );
}
