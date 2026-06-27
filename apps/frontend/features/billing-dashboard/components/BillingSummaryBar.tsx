"use client";

import { formatearMoneda } from "@/lib/utils";

interface BillingSummaryBarProps {
  totalInvoices: number;
  totalRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
}

export function BillingSummaryBar({
  totalInvoices,
  totalRevenue,
  paidAmount,
  outstandingAmount,
}: BillingSummaryBarProps) {
  return (
    <div className="sticky bottom-6 z-20 mx-auto mb-6 flex h-[78px] w-[90%] max-w-5xl items-center justify-center rounded-2xl border bg-card px-6 py-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-md">
      <div className="flex w-full divide-x divide-border overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1">
        <div className="flex flex-1 flex-col items-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Invoices
          </span>
          <span className="font-mono text-2xl font-bold text-foreground">
            {totalInvoices.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Revenue USD
          </span>
          <span className="font-mono text-2xl font-bold text-foreground">
            {formatearMoneda(totalRevenue)}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Paid USD
          </span>
          <span className="font-mono text-2xl font-bold text-primary">
            {formatearMoneda(paidAmount)}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Outstanding USD
          </span>
          <span className="font-mono text-2xl font-bold text-destructive">
            {formatearMoneda(outstandingAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
