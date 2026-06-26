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
    <div className="flex items-center gap-2">
      {/* Exportar (futuro) */}
      {/* TODO: hacer exportaciones */}
      {/* <Button variant="outline" size="sm" disabled>
        <Download className="h-4 w-4 mr-2" />
        Exportar
      </Button> */}

      {/* Reportes (futuro) */}
      {/* <Button variant="outline" size="sm" disabled>
        <FileText className="h-4 w-4 mr-2" />
        Reportes
      </Button> */}

      {/* Crear movimiento */}
      <Button
        onClick={onOpenCreateModal}
        size="sm"
        disabled={disabled}
        title={disabled ? "This period is closed" : undefined}
      >
        <Plus className="h-4 w-4 mr-2" />
        New Movement
      </Button>
    </div>
  );
}
