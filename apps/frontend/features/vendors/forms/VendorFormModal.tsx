"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VendedorForm } from "./VendorForm";
import type { CreateVendorDto } from "../schemas/VendorSchema";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingComponent } from "@/components/loading-component";
import { cn } from "@/lib/utils";

interface VendedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  form: UseFormReturn<CreateVendorDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingVendor?: boolean;
  vendorError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-lg",
);

function VendorFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function VendedorFormModal({
  isOpen,
  onClose,
  mode,
  form,
  onSubmit,
  isLoading = false,
  isLoadingVendor = false,
  vendorError = null,
}: VendedorFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Vendor" : "Edit Vendor";

  if (vendorError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <VendorFormModalBody>
            <ErrorBoundary
              error={vendorError}
              entityName="Vendor"
              url={{ path: "/vendors", displayText: "Back to Vendors" }}
            />
          </VendorFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingVendor && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <VendorFormModalBody>
            <LoadingComponent variant="form" rows={4} />
          </VendorFormModalBody>
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

        <VendorFormModalBody>
          <VendedorForm
            form={form}
            mode={mode}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </VendorFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
