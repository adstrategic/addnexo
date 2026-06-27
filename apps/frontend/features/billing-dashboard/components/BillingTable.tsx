"use client";

import { Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatearMoneda, getDaysFromDueDate } from "@/lib/utils";
import type { BillingInvoice, BillingStatus } from "../schemas/BillingSchemas";

interface BillingTableProps {
  invoices: BillingInvoice[];
  onViewInvoice: (inv: BillingInvoice) => void;
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function StatusBadge({ status }: { status: BillingStatus }) {
  if (status === "paid") {
    return (
      <span className="rounded-full border border-primary bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase text-primary">
        paid
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
        pending
      </span>
    );
  }
  return (
    <span className="rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold uppercase text-destructive-foreground">
      overdue
    </span>
  );
}

export function BillingTable({
  invoices,
  onViewInvoice,
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
}: BillingTableProps) {
  const subAmount = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const subTax = invoices.reduce((acc, curr) => acc + curr.tax, 0);
  const subTotal = invoices.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-b-xl border bg-card shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_var(--border)]">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Invoice
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Client
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Issue Date
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Due Date
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Due
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tax
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Total
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Method
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const isOverdue = inv.status === "overdue";
              const { days: daysFromDue } = getDaysFromDueDate(inv.due_date);
              return (
                <tr
                  key={inv.id}
                  className={cn(
                    "group border-b transition-colors hover:bg-accent/50",
                    isOverdue && "border-l-2 border-l-destructive bg-destructive/5",
                  )}
                >
                  <td
                    className="cursor-pointer px-4 py-3 font-mono text-[12px] font-semibold text-primary hover:underline"
                    onClick={() => onViewInvoice(inv)}
                  >
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-foreground/80">
                    {inv.client}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                    {inv.issue_date}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                    {inv.due_date}
                  </td>
                  <td className="px-4 py-3 text-center text-[12px]">
                    {inv.status === "paid" ? (
                      "Paid"
                    ) : daysFromDue === null ? (
                      "—"
                    ) : daysFromDue < 0 ? (
                      <span className="text-blue-600">
                        (-{Math.abs(daysFromDue)})
                      </span>
                    ) : (
                      <span className="text-destructive">({daysFromDue})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] font-medium text-foreground">
                    {formatearMoneda(inv.amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-muted-foreground">
                    {formatearMoneda(inv.tax)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] font-bold text-primary">
                    {formatearMoneda(inv.total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {inv.payment_method || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <Eye
                        size={16}
                        className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                        onClick={() => onViewInvoice(inv)}
                      />
                      <Download
                        size={16}
                        className="cursor-pointer text-muted-foreground transition-colors hover:text-primary"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {invoices.length > 0 && (
              <tr className="border-t bg-secondary">
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right font-semibold text-secondary-foreground"
                >
                  Subtotal (Visible Rows):
                </td>
                <td className="px-4 py-3 text-right font-mono text-[12px] font-bold text-secondary-foreground">
                  {formatearMoneda(subAmount)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[12px] font-bold text-secondary-foreground">
                  {formatearMoneda(subTax)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[13px] font-bold text-primary">
                  {formatearMoneda(subTotal)}
                </td>
                <td colSpan={3} />
              </tr>
            )}

            {invoices.length === 0 && (
              <tr>
                <td
                  colSpan={11}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No invoices matched your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">
            Showing{" "}
            <span className="font-bold text-foreground">
              {(page - 1) * pageSize + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-foreground">
              {Math.min(page * pageSize, totalItems)}
            </span>{" "}
            of {totalItems} invoices
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
