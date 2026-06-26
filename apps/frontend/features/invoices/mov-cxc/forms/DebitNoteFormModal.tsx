"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DebitNoteForm } from "./DebitNoteForm";
import type { UseFormReturn } from "react-hook-form";
import type { DebitNoteFormData } from "../schemas/mov-cxc-schema";

interface DebitNoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<DebitNoteFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  invoiceCreatedAt?: Date | null;
}

export function DebitNoteFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isLoading = false,
  invoiceCreatedAt,
}: DebitNoteFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Register Debit Note</DialogTitle>
        </DialogHeader>
        <DebitNoteForm
          form={form}
          onSubmit={onSubmit}
          onCancel={onClose}
          isLoading={isLoading}
          invoiceCreatedAt={invoiceCreatedAt}
        />
      </DialogContent>
    </Dialog>
  );
}
