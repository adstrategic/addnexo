"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SupplierForm } from "./SupplierForm";
import { LoadingComponent } from "@/components/loading-component";
import {
  CreateSupplierDTO,
  SupplierResponse,
} from "../schemas/SupplierSchemas";
import { ErrorBoundary } from "@/components/error-boundary";
import { UseFormReturn } from "react-hook-form";

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

  // Handle error state - if supplier was not found, show error and close modal
  if (supplierError && mode === "edit") {
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
            error={supplierError}
            entityName="Supplier"
            url={{ path: "/suppliers", displayText: "Back to Suppliers" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state
  if (isLoadingSupplier && mode === "edit") {
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
            <SupplierForm
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
