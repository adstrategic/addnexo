"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MovementTypeForm } from "./MovementTypeForm";
import { LoadingComponent } from "@/components/loading-component";
import type { TipoMovimiento } from "../types/server-types";
import type { UseFormReturn } from "react-hook-form";
import type { MovementTypeFormData } from "../schemas/movement-type-schema";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

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

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-4xl",
);

function MovementTypeFormModalBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
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

  if (movementTypeError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <MovementTypeFormModalBody>
            <ErrorBoundary
              error={movementTypeError}
              entityName="Movement Type"
              url={{
                path: "/movement-types",
                displayText: "Back to Movement Types",
              }}
            />
          </MovementTypeFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingMovementType && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <MovementTypeFormModalBody>
            <LoadingComponent variant="form" rows={8} />
          </MovementTypeFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className={dialogContentClassName}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <MovementTypeFormModalBody>
          <MovementTypeForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </MovementTypeFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
