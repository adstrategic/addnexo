"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlmacenForm } from "./AlmacenForm";
import LoadingComponent from "@/components/loading-component";
import type { AlmacenResponse } from "../schemas/almacenes.schema";
import type { UseFormReturn } from "react-hook-form";
import type { CreateAlmacenDto } from "../schemas/almacenes.schema";
import { ErrorBoundary } from "@/components/error-boundary";

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

  // Handle error state - if almacen was not found, show error and close modal
  if (almacenError && mode === "edit") {
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
            error={almacenError}
            entityName="Warehouse"
            url={{ path: "/warehouses", displayText: "Back to Warehouses" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state
  if (isLoadingAlmacen && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
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
            <AlmacenForm
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
