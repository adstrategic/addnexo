"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BankForm } from "./BankForm";
import { LoadingComponent } from "@/components/loading-component";
import type { UseFormReturn } from "react-hook-form";
import type { CreateBankDto } from "../schemas/BankSchema";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";

interface BankFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  form: UseFormReturn<CreateBankDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingBank?: boolean;
  bankError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-lg",
);

function BankFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function BankFormModal({
  isOpen,
  onClose,
  mode,
  form,
  onSubmit,
  isLoading = false,
  isLoadingBank = false,
  bankError = null,
}: BankFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Bank" : "Edit Bank";

  if (bankError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <BankFormModalBody>
            <ErrorBoundary
              error={bankError}
              entityName="Bank"
              url={{ path: "/banks", displayText: "Back to Banks" }}
            />
          </BankFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingBank && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <BankFormModalBody>
            <LoadingComponent variant="form" rows={3} />
          </BankFormModalBody>
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

        <BankFormModalBody>
          <BankForm
            form={form}
            mode={mode}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </BankFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
