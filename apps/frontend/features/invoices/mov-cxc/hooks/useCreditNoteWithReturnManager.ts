"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  creditNoteWithReturnFormSchema,
  type CreditNoteWithReturnFormData,
} from "../schemas/mov-cxc-schema";
import { useRegistrarNotaCreditoConDevolucion } from "./useMovCXC";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";
import { combineDateWithCurrentTimeUTC, toDateOnly } from "@/lib/dateUtils";

interface UseCreditNoteWithReturnManagerOptions {
  onAfterSubmit?: () => void;
}

export function useCreditNoteWithReturnManager(
  options?: UseCreditNoteWithReturnManagerOptions,
) {
  // === UI STATE ===
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [invoiceCreatedAt, setInvoiceCreatedAt] = useState<Date | null>(null);

  // === MUTATIONS ===
  const registrarNotaCreditoConDevolucionMutation =
    useRegistrarNotaCreditoConDevolucion();

  // === FORM CONFIGURATION ===
  const defaultValues: CreditNoteWithReturnFormData = {
    MCNroDocumento: "",
    MCDescripcion: "",
    MCFecha: new Date(),
    items: [],
  };

  const form = useForm<CreditNoteWithReturnFormData>({
    resolver: zodResolver(creditNoteWithReturnFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // === HANDLERS ===

  // Open modal for a specific invoice
  const open = (invoiceId: number, invoiceCreatedAtDate: Date) => {
    setInvoiceId(invoiceId);
    setInvoiceCreatedAt(invoiceCreatedAtDate);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setInvoiceId(null);
    setInvoiceCreatedAt(null);
    form.reset(defaultValues);
  };

  // Form submission
  const onSubmit = form.handleSubmit(
    async (data) => {
      if (!invoiceId) {
        toast.error("No invoice selected");
        return;
      }

      if (
        invoiceCreatedAt != null &&
        toDateOnly(data.MCFecha) < toDateOnly(invoiceCreatedAt)
      ) {
        form.setError("MCFecha", {
          message: "Date cannot be before the invoice creation date",
        });
        return;
      }

      try {
        const dataToSend = {
          ...data,
          MCFecha: combineDateWithCurrentTimeUTC(data.MCFecha),
        };
        await registrarNotaCreditoConDevolucionMutation.mutateAsync({
          invoiceId,
          data: dataToSend,
        });

        toast.success("Credit note with return registered successfully");
        close();
        options?.onAfterSubmit?.();
      } catch (error) {
        handleMutationError(error, form.setError);
      }
    },
    (errors) => {
      // Scroll to first error field if needed
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(
          `[name="${firstErrorField}"]`,
        ) as HTMLElement;
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
  );

  return {
    // Modal state
    isOpen,
    open,
    close,
    invoiceId,
    invoiceCreatedAt,

    // Form
    form,
    onSubmit,
    isMutating: registrarNotaCreditoConDevolucionMutation.isPending,
  };
}
