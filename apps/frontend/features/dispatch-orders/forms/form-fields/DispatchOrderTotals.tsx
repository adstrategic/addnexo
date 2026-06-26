"use client";

import { useMemo } from "react";
import type { DispatchOrderResponse } from "../../schemas/dispatch-order-response.schema";

interface DispatchOrderTotalsProps {
  dispatchOrder?: DispatchOrderResponse;
}

/**
 * DispatchOrderTotals - Displays totals from server-calculated values
 *
 * All totals are calculated and stored by the server:
 * - Gross Total = DOGValorTotalBruto
 * - Total Discounts = DOGTotalDescuento
 * - Total VAT = DOGTotalIVA
 * - Net Total = DOGValorTotalNeto
 *
 * Subtotal is calculated as: Gross - Discounts (after discounts, before VAT)
 */
export function DispatchOrderTotals({
  dispatchOrder,
}: DispatchOrderTotalsProps) {
  const totals = useMemo(() => {
    // Use server-calculated totals directly
    const grossTotal = Number(dispatchOrder?.DOGValorTotalBruto) || 0;
    const totalDiscounts = Number(dispatchOrder?.DOGTotalDescuento) || 0;
    const totalTax = Number(dispatchOrder?.DOGTotalIVA) || 0;
    const netTotal = Number(dispatchOrder?.DOGValorTotalNeto) || 0;
    const totalWeightKg = Number(dispatchOrder?.DOGPesoTotalKg) || 0;

    // Subtotal = Gross - Discounts (after discounts, before VAT)
    const subtotal = grossTotal - totalDiscounts;

    return {
      grossTotal,
      totalDiscounts,
      subtotal,
      totalTax,
      netTotal,
      totalWeightKg,
    };
  }, [dispatchOrder]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Gross Total:</span>
        <span className="font-medium">{formatCurrency(totals.grossTotal)}</span>
      </div>

      {totals.totalDiscounts > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Discounts:</span>
          <span className="font-medium text-red-600">
            -{formatCurrency(totals.totalDiscounts)}
          </span>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal:</span>
        <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
      </div>

      {totals.totalTax > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (IVA):</span>
          <span className="font-medium">{formatCurrency(totals.totalTax)}</span>
        </div>
      )}

      <div className="flex justify-between border-t pt-2">
        <span className="font-semibold text-base">Total:</span>
        <span className="font-bold text-lg">
          {formatCurrency(totals.netTotal)}
        </span>
      </div>

      <div className="flex justify-between mt-6">
        <span className="text-muted-foreground text-lg">
          Total Weight (KG):
        </span>
        <span className="font-medium text-sm">
          {totals.totalWeightKg.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
