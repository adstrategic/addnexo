"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentForm } from "./PaymentForm";
import type { UseFormReturn } from "react-hook-form";
import type { PaymentFormData } from "../schemas/mov-cxc-schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<PaymentFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  invoiceCreatedAt?: Date | null;
}

export function PaymentFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isLoading = false,
  invoiceCreatedAt,
}: PaymentFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>Register Payment</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="px-6 py-4">
            <PaymentForm
              form={form}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isLoading}
              invoiceCreatedAt={invoiceCreatedAt}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
