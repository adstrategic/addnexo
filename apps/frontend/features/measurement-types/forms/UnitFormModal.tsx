"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UnitForm } from "./UnitForm";
import type { UnitResponse, CreateUnitDto } from "../schemas/units.schema";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingComponent } from "@/components/loading-component";
import { cn } from "@/lib/utils";

interface UnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: UnitResponse;
  form: UseFormReturn<CreateUnitDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingUnit?: boolean;
  unitError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-lg",
);

function UnitFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function UnitFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingUnit = false,
  unitError = null,
}: UnitFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Unit" : "Edit Unit";

  if (unitError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <UnitFormModalBody>
            <ErrorBoundary
              error={unitError}
              entityName="Unit"
              url={{
                path: "/measurement-types",
                displayText: "Back to Measurement Units",
              }}
            />
          </UnitFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingUnit && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <UnitFormModalBody>
            <LoadingComponent variant="form" rows={4} />
          </UnitFormModalBody>
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

        <UnitFormModalBody>
          <UnitForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </UnitFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
