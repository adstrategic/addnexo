"use client";

import { useState } from "react";
import { useAnnulDispatchOrder } from "./useDispatchOrders";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { toast } from "sonner";

/**
 * Custom hook that encapsulates dispatch order annulment logic:
 * - Modal state management
 * - Mutation logic for annulling dispatch order
 * - Toast notifications
 * - Success callbacks
 *
 * @example
 * ```tsx
 * const annulment = useDispatchOrderAnnulment();
 *
 * // In your component:
 * <Button onClick={() => annulment.openModal(dispatchOrder)}>
 *   Annul
 * </Button>
 *
 * <DispatchOrderAnnulModal
 *   isOpen={annulment.isModalOpen}
 *   onClose={annulment.closeModal}
 *   onConfirm={annulment.handleConfirm}
 *   dispatchOrder={annulment.selectedDispatchOrder}
 *   isAnulling={annulment.isAnulling}
 * />
 * ```
 */
export function useDispatchOrderAnnulment() {
  const annulMutation = useAnnulDispatchOrder();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDispatchOrder, setSelectedDispatchOrder] =
    useState<DispatchOrderResponse | null>(null);

  // Handle annulment
  const handleAnnul = async (
    secuencia: number,
    razonAnulacion?: string,
  ): Promise<{ success: boolean }> => {
    try {
      await annulMutation.mutateAsync({
        secuencia,
        razonAnulacion,
      });

      toast.success("Dispatch order annulled successfully", {
        description:
          "The dispatch order has been annulled and inventory has been restored",
      });

      return { success: true };
    } catch (error: any) {
      toast.error("Error annulling dispatch order", {
        description:
          error.message ||
          "An error occurred while annulling the dispatch order",
      });
      return { success: false };
    }
  };

  // Modal control functions
  const openModal = (dispatchOrder: DispatchOrderResponse) => {
    setSelectedDispatchOrder(dispatchOrder);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Don't clear dispatchOrder immediately to allow for smooth modal close animation
    setTimeout(() => {
      setSelectedDispatchOrder(null);
    }, 200);
  };

  const handleConfirm = async (razonAnulacion?: string) => {
    if (!selectedDispatchOrder) return;

    const result = await handleAnnul(
      selectedDispatchOrder.DOGOrgSecuencia,
      razonAnulacion,
    );

    if (result.success) {
      closeModal();
    }
  };

  // Computed loading state
  const isAnulling = annulMutation.isPending;

  return {
    // Modal state
    isModalOpen,
    selectedDispatchOrder,

    // Handlers
    handleAnnul,
    handleConfirm,

    // Modal controls
    openModal,
    closeModal,

    // Loading state
    isAnulling,
  };
}
