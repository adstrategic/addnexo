"use client";

// Types
import type { UseFormReturn } from "react-hook-form";
import type { CreateVendorDto } from "../schemas/VendorSchema";

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingComponent } from "@/components/loading-component";
import { ErrorBoundary } from "@/components/error-boundary";

// Components
import { VendedorForm } from "./VendorForm";

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
          className="max-w-4xl max-h-[90vh] p-0"
        >
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            error={vendorError}
            entityName="Vendor"
            url={{ path: "/vendors", displayText: "Back to Vendors" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Handle loading state
  if (isLoadingVendor && mode === "edit") {
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
            <VendedorForm
              form={form}
              mode={mode}
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
