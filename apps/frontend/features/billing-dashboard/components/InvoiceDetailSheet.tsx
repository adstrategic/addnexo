"use client";

import { AlertCircle, CheckCircle, Clock, FileText, X } from "lucide-react";

import { formatearMoneda } from "@/lib/utils";
import type { BillingInvoice } from "../schemas/BillingSchemas";

interface InvoiceDetailSheetProps {
  invoice: BillingInvoice | null;
  onClose: () => void;
}

export function InvoiceDetailSheet({ invoice, onClose }: InvoiceDetailSheetProps) {
  if (!invoice) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-[450px] flex-col border-l bg-card shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText size={18} className="text-primary" />
              {invoice.invoice_number}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {invoice.client}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-accent"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Status & Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-muted p-3">
              <div className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                Status
              </div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                {invoice.status === "paid" && (
                  <>
                    <CheckCircle size={14} className="text-primary" />
                    <span className="uppercase text-primary">Paid</span>
                  </>
                )}
                {invoice.status === "pending" && (
                  <>
                    <Clock size={14} className="text-muted-foreground" />
                    <span className="uppercase text-muted-foreground">
                      Pending
                    </span>
                  </>
                )}
                {invoice.status === "overdue" && (
                  <>
                    <AlertCircle size={14} className="text-destructive" />
                    <span className="uppercase text-destructive">Overdue</span>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3">
              <div className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                Payment Method
              </div>
              <div className="text-[13px] font-medium text-foreground">
                {invoice.payment_method || "N/A"}
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3">
              <div className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                Issue Date
              </div>
              <div className="font-mono text-[12px] text-foreground/80">
                {invoice.issue_date}
              </div>
            </div>

            <div className="rounded-lg border bg-muted p-3">
              <div className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">
                Due Date
              </div>
              <div className="font-mono text-[12px] font-semibold text-destructive">
                {invoice.due_date}
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div>
            <h3 className="mb-3 border-b pb-2 text-[13px] font-semibold text-foreground">
              Financial Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Amount Before Tax</span>
                <span className="font-mono text-foreground">
                  {formatearMoneda(invoice.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-mono text-muted-foreground">
                  {formatearMoneda(invoice.tax)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-dashed pt-3">
                <span className="font-bold text-foreground">Total amount</span>
                <span className="font-mono text-lg font-bold text-primary">
                  {formatearMoneda(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="mb-2 border-b pb-2 text-[13px] font-semibold text-foreground">
                Internal Notes
              </h3>
              <div className="rounded border border-amber-300 bg-amber-50 p-3 text-[13px] text-foreground/80 dark:border-amber-700 dark:bg-amber-950/30">
                {invoice.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 border-t bg-muted p-6">
          <button className="flex-1 rounded-lg border bg-card py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-accent">
            Contact Client
          </button>
          <button className="flex-1 rounded-lg bg-primary py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
            Download PDF
          </button>
        </div>
      </div>
    </>
  );
}
