"use client";

import type { Factura } from "../../schemas/BalanceInvoicesResponseSchema";
import { formatearMoneda } from "@/lib/utils";

interface BalanceInvoiceTotalsProps {
  factura?: Factura;
}

export function BalanceInvoiceTotals({ factura }: BalanceInvoiceTotalsProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between border-t pt-2">
        <span className="font-semibold text-base">Total:</span>
        <span className="font-bold text-lg">
          {formatearMoneda(factura?.FGSaldo || 0)}
        </span>
      </div>
    </div>
  );
}
