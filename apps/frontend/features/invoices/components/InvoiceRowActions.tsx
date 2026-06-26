import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import { EstadoInvoice, type ServerInvoice } from "../schemas/invoices-response.schema";

interface InvoiceRowActionsProps {
  invoice: ServerInvoice;
  showTestInvoicePdfDownload?: boolean;
  isDownloadingPdf?: boolean;
  onDownloadPdf?: (sequence: number) => void;
  onAddPayment: (invoice: ServerInvoice) => void;
  onDebitNote: (invoice: ServerInvoice) => void;
  onCreditNote: (invoice: ServerInvoice) => void;
  onReturnInventory: (invoice: ServerInvoice) => void;
}

export function InvoiceRowActions({
  invoice,
  showTestInvoicePdfDownload = false,
  isDownloadingPdf = false,
  onDownloadPdf,
  onAddPayment,
  onDebitNote,
  onCreditNote,
  onReturnInventory,
}: InvoiceRowActionsProps) {
  const isPaid = invoice.FGEstado === EstadoInvoice.PAID;
  const sequence = invoice.FGOrgSecuencia;
  const label = `Actions for invoice #${invoice.FGNro}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer"
          aria-label={label}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-blue-800 focus:text-blue-800 dark:text-blue-400 dark:focus:text-blue-400"
        >
          <Link
            href={`/invoices/${sequence}`}
            className="flex items-center gap-2"
          >
            <Eye
              className="size-4 text-blue-800 dark:text-blue-400"
              aria-hidden
            />
            View details
          </Link>
        </DropdownMenuItem>

        {showTestInvoicePdfDownload && onDownloadPdf ? (
          <DropdownMenuItem
            className="cursor-pointer text-muted-foreground"
            disabled={isDownloadingPdf}
            onClick={() => onDownloadPdf(sequence)}
          >
            <Download className="size-4" aria-hidden />
            Download invoice PDF (test)
          </DropdownMenuItem>
        ) : null}

        {!isPaid ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
              onClick={() => onAddPayment(invoice)}
            >
              <DollarSign className="size-4" aria-hidden />
              Add payment
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-orange-600 focus:text-orange-600 dark:text-orange-400 dark:focus:text-orange-400"
              onClick={() => onDebitNote(invoice)}
            >
              <FileText className="size-4" aria-hidden />
              Debit note
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-blue-600 focus:text-blue-600 dark:text-blue-400 dark:focus:text-blue-400"
              onClick={() => onCreditNote(invoice)}
            >
              <FileText className="size-4" aria-hidden />
              Credit note
            </DropdownMenuItem>
            {!invoice.FGFacturaDeSaldo ? (
              <DropdownMenuItem
                className="cursor-pointer text-violet-600 focus:text-violet-600 dark:text-violet-400 dark:focus:text-violet-400"
                onClick={() => onReturnInventory(invoice)}
              >
                <RotateCcw className="size-4" aria-hidden />
                Return inventory
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
