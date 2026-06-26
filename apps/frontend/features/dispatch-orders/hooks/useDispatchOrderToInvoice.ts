"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import type { TipoPago } from "../schemas/dispatch-order-to-invoice.schema";
import { useConvertDispatchOrderToInvoice } from "./useDispatchOrders";

/**
 * Encapsulates the dispatch-order → invoice conversion flow:
 * - modal state management
 * - calling the conversion endpoint (POST /invoices)
 * - toast notifications and navigation to the new invoice on success
 */
export function useDispatchOrderToInvoice() {
  const router = useRouter();
  const convertMutation = useConvertDispatchOrderToInvoice();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDispatchOrder, setSelectedDispatchOrder] =
    useState<DispatchOrderResponse | null>(null);

  const openModal = (dispatchOrder: DispatchOrderResponse) => {
    setSelectedDispatchOrder(dispatchOrder);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Delay clearing so the modal close animation can finish.
    setTimeout(() => setSelectedDispatchOrder(null), 200);
  };

  const handleConfirm = async (diasParaVencimiento: number, pago: TipoPago) => {
    if (!selectedDispatchOrder) return;

    try {
      const invoice = await convertMutation.mutateAsync({
        secuencia: selectedDispatchOrder.DOGOrgSecuencia,
        data: {
          dispatchOrderId: selectedDispatchOrder.DOGId,
          diasParaVencimiento,
          pago,
        },
      });

      toast.success("Invoice created", {
        description: `Dispatch Order #${selectedDispatchOrder.DOGNro} was converted to Invoice #${invoice.FGNro}.`,
      });

      closeModal();
      router.push(`/invoices/${invoice.FGOrgSecuencia}`);
    } catch (error) {
      toast.error("Conversion failed", {
        description:
          error instanceof Error
            ? error.message
            : "Could not convert the dispatch order to an invoice.",
      });
    }
  };

  return {
    isModalOpen,
    selectedDispatchOrder,
    handleConfirm,
    openModal,
    closeModal,
    isCreating: convertMutation.isPending,
  };
}
