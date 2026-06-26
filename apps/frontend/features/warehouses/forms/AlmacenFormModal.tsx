"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlmacenForm } from "./AlmacenForm";
import { LoadingComponent } from "@/components/loading-component";
import type { AlmacenResponse, CreateAlmacenDto } from "../schemas/almacenes.schema";
import { ErrorBoundary } from "@/components/error-boundary";
import type { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface AlmacenFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: AlmacenResponse;
  form: UseFormReturn<CreateAlmacenDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingAlmacen?: boolean;
  almacenError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-4xl",
);

function AlmacenFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function AlmacenFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingAlmacen = false,
  almacenError = null,
}: AlmacenFormModalProps) {
  const modalTitle =
    mode === "create" ? "Create New Warehouse" : "Edit Warehouse";

  if (almacenError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <AlmacenFormModalBody>
            <ErrorBoundary
              error={almacenError}
              entityName="Warehouse"
              url={{ path: "/warehouses", displayText: "Back to Warehouses" }}
            />
          </AlmacenFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingAlmacen && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <AlmacenFormModalBody>
            <LoadingComponent variant="form" rows={8} />
          </AlmacenFormModalBody>
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

        <AlmacenFormModalBody>
          <AlmacenForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </AlmacenFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
