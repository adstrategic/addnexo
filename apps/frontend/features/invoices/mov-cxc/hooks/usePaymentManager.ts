"use client";

import { useState } from "react";
import { DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  paymentFormSchema,
  type PaymentFormData,
} from "../schemas/mov-cxc-schema";
import type { TipoPago } from "../../schemas/invoices-response.schema";
import { useRegistrarPago } from "./useMovCXC";
import { handleMutationError } from "@/lib/errors/handle-error";
import { toast } from "sonner";
import { combineDateWithCurrentTimeUTC, toDateOnly } from "@/lib/dateUtils";

interface UsePaymentManagerOptions {
  onAfterSubmit?: () => void;
}

export function usePaymentManager(options?: UsePaymentManagerOptions) {
  // === UI STATE ===
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [invoiceCreatedAt, setInvoiceCreatedAt] = useState<Date | null>(null);

  // === MUTATIONS ===
  const registrarPagoMutation = useRegistrarPago();

  // === FORM CONFIGURATION ===
  const defaultValues: DefaultValues<PaymentFormData> = {
    MCTipoPago: "CONTADO",
    MCNroDocumento: "",
    MCDescripcion: "",
    MCFecha: new Date(),
    walletDetails: undefined,
    creditCardDetails: undefined,
    transferDetails: undefined,
    checkDetails: undefined,
  };

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  // === HANDLERS ===

  // Open modal for a specific invoice (invoicePaymentType defaults the payment type selector)
  const open = (
    invoiceId: number,
    invoiceCreatedAtDate: Date,
    invoicePaymentType?: TipoPago,
  ) => {
    setInvoiceId(invoiceId);
    setInvoiceCreatedAt(invoiceCreatedAtDate);
    form.reset({
      ...defaultValues,
      MCTipoPago: invoicePaymentType ?? defaultValues.MCTipoPago,
    });
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
        const mcFechaToSend = combineDateWithCurrentTimeUTC(data.MCFecha);

        const dataToSend = {
          ...data,
          MCFecha: mcFechaToSend,
        };

        await registrarPagoMutation.mutateAsync({
          invoiceId,
          data: dataToSend,
        });

        toast.success("Payment registered successfully");
        close();
        options?.onAfterSubmit?.();
      } catch (error) {
        handleMutationError(error, form.setError);
      }
    },
    (errors) => {
      console.log(errors);
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
    isMutating: registrarPagoMutation.isPending,
  };
}
