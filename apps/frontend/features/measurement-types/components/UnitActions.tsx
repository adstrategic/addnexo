"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface UnitActionsProps {
  onOpenCreateModal: () => void;
}

export function UnitActions({ onOpenCreateModal }: UnitActionsProps) {
  return (
    <Button onClick={onOpenCreateModal}>
      <Plus className="mr-2 h-4 w-4" />
      New Unit
    </Button>
  );
}
