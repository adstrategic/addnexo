"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "./SupplierForm";
import { LoadingComponent } from "@/components/loading-component";
import {
  CreateSupplierDTO,
  SupplierResponse,
} from "../schemas/SupplierSchemas";
import { ErrorBoundary } from "@/components/error-boundary";
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: SupplierResponse;
  form: UseFormReturn<CreateSupplierDTO>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingSupplier?: boolean;
  supplierError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-4xl",
);

function SupplierFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function SupplierFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingSupplier = false,
  supplierError = null,
}: SupplierFormModalProps) {
  const modalTitle =
    mode === "create" ? "Create New Supplier" : "Edit Supplier";

  if (supplierError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <SupplierFormModalBody>
            <ErrorBoundary
              error={supplierError}
              entityName="Supplier"
              url={{ path: "/suppliers", displayText: "Back to Suppliers" }}
            />
          </SupplierFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingSupplier && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <SupplierFormModalBody>
            <LoadingComponent variant="form" rows={8} />
          </SupplierFormModalBody>
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

        <SupplierFormModalBody>
          <SupplierForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </SupplierFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
