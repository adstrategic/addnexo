import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, FileText, User } from "lucide-react";
import { formatearFecha, formatearMoneda, getDaysFromDueDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  EstadoInvoice,
  type ServerInvoice,
} from "../schemas/invoices-response.schema";
import { InvoiceDueIndicator } from "./InvoiceDueIndicator";
import { InvoiceLoadTypeBadge } from "./InvoiceLoadTypeBadge";
import { InvoiceRowActions } from "./InvoiceRowActions";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

interface InvoiceMobileCardProps {
  invoice: ServerInvoice;
  showTestInvoicePdfDownload?: boolean;
  isDownloadingPdf?: boolean;
  onDownloadPdf?: (sequence: number) => void;
  onAddPayment: (invoice: ServerInvoice) => void;
  onDebitNote: (invoice: ServerInvoice) => void;
  onCreditNote: (invoice: ServerInvoice) => void;
  onReturnInventory: (invoice: ServerInvoice) => void;
}

export function InvoiceMobileCard({
  invoice,
  showTestInvoicePdfDownload,
  isDownloadingPdf,
  onDownloadPdf,
  onAddPayment,
  onDebitNote,
  onCreditNote,
  onReturnInventory,
}: InvoiceMobileCardProps) {
  const clientName = invoice.cltemae?.CRazonSocial || "N/A";
  const vendorName = invoice.vendedor?.VNombre;
  const isActive = invoice.FGEstado === EstadoInvoice.ACTIVE;
  const isOverdue = invoice.FGEstado === EstadoInvoice.OVERDUE;
  const { isOverdue30 } = getDaysFromDueDate(invoice.FGFechaVencimiento);
  const showRedAmounts = (isActive || isOverdue) && isOverdue30;

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <FileText className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/invoices/${invoice.FGOrgSecuencia}`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Invoice #{invoice.FGNro}
              </Link>
              {invoice.FGPurchaseOrder ? (
                <p className="text-xs text-muted-foreground">
                  PO {invoice.FGPurchaseOrder}
                </p>
              ) : null}
            </div>

            <InvoiceRowActions
              invoice={invoice}
              showTestInvoicePdfDownload={showTestInvoicePdfDownload}
              isDownloadingPdf={isDownloadingPdf}
              onDownloadPdf={onDownloadPdf}
              onAddPayment={onAddPayment}
              onDebitNote={onDebitNote}
              onCreditNote={onCreditNote}
              onReturnInventory={onReturnInventory}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={invoice.FGEstado} />
            <InvoiceLoadTypeBadge
              isBalanceInvoice={Boolean(invoice.FGFacturaDeSaldo)}
            />
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">{clientName}</span>
            </span>
            {vendorName ? (
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5 shrink-0" aria-hidden />
                {vendorName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              Due{" "}
              {formatearFecha(invoice.FGFechaVencimiento, { conTiempo: false })}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <InvoiceDueIndicator
              dueDate={invoice.FGFechaVencimiento}
              status={invoice.FGEstado}
            />
            <div className="text-right">
              <p
                className={cn(
                  "font-medium",
                  showRedAmounts
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground",
                )}
              >
                {formatearMoneda(invoice.FGSaldo)}
              </p>
              <p className="text-xs text-muted-foreground">
                of {formatearMoneda(invoice.FGValorTotalNeto)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
