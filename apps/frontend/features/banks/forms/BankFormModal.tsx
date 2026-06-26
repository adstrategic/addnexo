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

export function BankFormModal(props: BankFormModalProps) {
  const {
    isOpen,
    onClose,
    mode,
    form,
    onSubmit,
    isLoading = false,
    isLoadingBank = false,
    bankError = null,
  } = props;
  const modalTitle = mode === "create" ? "Create New Bank" : "Edit Bank";

  if (bankError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <ErrorBoundary
            error={bankError}
            entityName="Bank"
            url={{ path: "/banks", displayText: "Back to Banks" }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingBank && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <LoadingComponent variant="form" rows={3} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <BankForm
            form={form}
            mode={mode}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
