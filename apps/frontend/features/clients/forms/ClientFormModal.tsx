"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientForm } from "./ClientForm";
import { LoadingComponent } from "@/components/loading-component";
import type { ClienteResponse } from "../schemas/ClientSchema";
import type { UseFormReturn } from "react-hook-form";
import type { ClientFormData } from "../schemas/ClientSchema";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: ClienteResponse;
  form: UseFormReturn<ClientFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingClient?: boolean;
  clientError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-4xl",
);

function ClientFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function ClientFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingClient = false,
  clientError = null,
}: ClientFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Client" : "Edit Client";

  if (clientError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ClientFormModalBody>
            <ErrorBoundary
              error={clientError}
              entityName="Client"
              url={{ path: "/clients", displayText: "Back to Clients" }}
            />
          </ClientFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingClient && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ClientFormModalBody>
            <LoadingComponent variant="form" rows={8} />
          </ClientFormModalBody>
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

        <ClientFormModalBody>
          <ClientForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </ClientFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
