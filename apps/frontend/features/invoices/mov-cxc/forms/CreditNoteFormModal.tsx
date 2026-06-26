"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreditNoteForm } from "./CreditNoteForm";
import type { UseFormReturn } from "react-hook-form";
import type { CreditNoteFormData } from "../schemas/mov-cxc-schema";

interface CreditNoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<CreditNoteFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  invoiceCreatedAt?: Date | null;
}

export function CreditNoteFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isLoading = false,
  invoiceCreatedAt,
}: CreditNoteFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Register Credit Note</DialogTitle>
          <DialogDescription>
            Register a credit note for this invoice. This will reduce the
            invoice balance.
          </DialogDescription>
        </DialogHeader>
        <CreditNoteForm
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
