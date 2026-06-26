"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductForm } from "./CatalogForm";
import { LoadingComponent } from "@/components/loading-component";
import type { Producto } from "../types/server-types";
import type { UseFormReturn } from "react-hook-form";
import type { ProductFormData } from "../schemas/CatalogSchema";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: Producto;
  form: UseFormReturn<ProductFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingProduct?: boolean;
  productError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-4xl",
);

function ProductFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function ProductFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingProduct = false,
  productError = null,
}: ProductFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Product" : "Edit Product";

  if (productError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={dialogContentClassName}>
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ProductFormModalBody>
            <ErrorBoundary
              error={productError}
              entityName="Product"
              url={{ path: "/catalog", displayText: "Back to Products" }}
            />
          </ProductFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingProduct && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={dialogContentClassName}>
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ProductFormModalBody>
            <LoadingComponent variant="form" rows={8} />
          </ProductFormModalBody>
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

        <ProductFormModalBody>
          <ProductForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </ProductFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
