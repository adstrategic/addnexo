"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MovementTypeForm } from "./MovementTypeForm";
import { LoadingComponent } from "@/components/loading-component";
import type { TipoMovimiento } from "../types/server-types";
import type { UseFormReturn } from "react-hook-form";
import type { MovementTypeFormData } from "../schemas/movement-type-schema";
import { ErrorBoundary } from "@/components/error-boundary";

interface MovementTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: TipoMovimiento;
  form: UseFormReturn<MovementTypeFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingMovementType?: boolean;
  movementTypeError?: Error | null;
}

export function MovementTypeFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingMovementType = false,
  movementTypeError = null,
}: MovementTypeFormModalProps) {
  const modalTitle =
    mode === "create" ? "Create New Movement Type" : "Edit Movement Type";

  // Handle error state - if movement type was not found, show error and close modal
  if (movementTypeError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-4xl max-h-[90vh] p-0"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            error={movementTypeError}
            entityName="Movement Type"
            url={{
              path: "/movement-types",
              displayText: "Back to Movement Types",
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state
  if (isLoadingMovementType && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-4xl max-h-[90vh] p-0"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-80px)]">
            <div className="px-6 py-4">
              <LoadingComponent variant="form" rows={8} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-4xl max-h-[90vh] p-0"
      >
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-4">
            <MovementTypeForm
              form={form}
              mode={mode}
              initialData={initialData}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isLoading}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
