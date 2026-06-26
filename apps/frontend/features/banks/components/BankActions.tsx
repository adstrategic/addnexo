"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BankActionsProps {
  onOpenCreateModal: () => void;
}

export function BankActions({ onOpenCreateModal }: BankActionsProps) {
  return (
    <Button onClick={onOpenCreateModal} className="gap-2">
      <Plus className="h-4 w-4" />
      Add Bank
    </Button>
  );
}
