"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";
import invoiceApi from "../services/invoices.api";
import {
  cn,
  formatearFecha,
  formatearMoneda,
  getDaysFromDueDate,
  getPageNumbers,
} from "@/lib/utils";
import {
  EstadoInvoice,
  type ServerInvoice,
} from "../schemas/invoices-response.schema";
import {
  usePaymentManager,
  useDebitNoteManager,
  useCreditNoteManager,
  useCreditNoteWithReturnManager,
  PaymentFormModal,
  DebitNoteFormModal,
  CreditNoteFormModal,
  CreditNoteWithReturnDialog,
} from "../mov-cxc";
import { InvoiceEmptyState } from "./InvoiceEmptyState";
import { InvoiceDueIndicator } from "./InvoiceDueIndicator";
import { InvoiceLoadTypeBadge } from "./InvoiceLoadTypeBadge";
import { InvoiceMobileCard } from "./InvoiceMobileCard";
import { InvoiceRowActions } from "./InvoiceRowActions";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceTableSkeleton } from "./InvoiceTableSkeleton";
import { invoiceListPadding } from "./layout/invoice-list-layout";

interface InvoicesTableProps {
  invoices: ServerInvoice[];
  isLoading: boolean;
  isFetching?: boolean;
  showTestInvoicePdfDownload?: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

type SortKey =
  | "invoiceNumber"
  | "originalLoad"
  | "purchaseOrder"
  | "client"
  | "vendor"
  | "issuedDate"
  | "dueDate"
  | "due"
  | "totalAmount"
  | "balance"
  | "status";

function getInvoiceSortValue(
  invoice: ServerInvoice,
  key: SortKey,
): string | number {
  switch (key) {
    case "invoiceNumber":
      return invoice.FGNro;
    case "originalLoad":
      return invoice.FGFacturaDeSaldo ? 1 : 0;
    case "purchaseOrder":
      return invoice.FGPurchaseOrder ?? "";
    case "client":
      return invoice.cltemae?.CRazonSocial ?? "";
    case "vendor":
      return invoice.vendedor?.VNombre ?? "";
    case "issuedDate":
      return new Date(invoice.FGFechaCreado).getTime();
    case "dueDate":
      return new Date(invoice.FGFechaVencimiento).getTime();
    case "due": {
      if (invoice.FGEstado === EstadoInvoice.PAID) {
        return Number.NEGATIVE_INFINITY;
      }
      const { days } = getDaysFromDueDate(invoice.FGFechaVencimiento);
      return days ?? Number.POSITIVE_INFINITY;
    }
    case "totalAmount":
      return invoice.FGValorTotalNeto;
    case "balance":
      return invoice.FGSaldo;
    case "status":
      return invoice.FGEstado;
  }
}

function sortInvoices(
  items: ServerInvoice[],
  sortKey: SortKey,
  sortAsc: boolean,
): ServerInvoice[] {
  return [...items].sort((a, b) => {
    const aVal = getInvoiceSortValue(a, sortKey);
    const bVal = getInvoiceSortValue(b, sortKey);

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });
}

function InvoicePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  InvoicesTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        invoiceListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "invoice" : "invoices"}
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={cn(
                "cursor-pointer",
                (currentPage <= 1 || totalPages <= 1) &&
                  "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>

          {getPageNumbers(totalPages, currentPage).map((page, index) => (
            <PaginationItem key={index} className="hidden sm:list-item">
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={cn(
                "cursor-pointer",
                (currentPage >= totalPages || totalPages <= 1) &&
                  "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function InvoicesTable({
  invoices,
  isLoading,
  isFetching = false,
  showTestInvoicePdfDownload = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: InvoicesTableProps) {
  const [invoicePdfDownloadingSecuencia, setInvoicePdfDownloadingSecuencia] =
    useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("issuedDate");
  const [sortAsc, setSortAsc] = useState(false);

  const paymentManager = usePaymentManager();
  const debitNoteManager = useDebitNoteManager();
  const creditNoteManager = useCreditNoteManager();
  const creditNoteWithReturnManager = useCreditNoteWithReturnManager();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const displayData = useMemo(
    () => sortInvoices(invoices, sortKey, sortAsc),
    [invoices, sortKey, sortAsc],
  );

  const handleAddPayment = (invoice: ServerInvoice) => {
    paymentManager.open(
      invoice.FGId,
      new Date(invoice.FGFechaCreado),
      invoice.FGPago,
    );
  };

  const handleDebitNote = (invoice: ServerInvoice) => {
    debitNoteManager.open(invoice.FGId, new Date(invoice.FGFechaCreado));
  };

  const handleCreditNote = (invoice: ServerInvoice) => {
    creditNoteManager.open(invoice.FGId, new Date(invoice.FGFechaCreado));
  };

  const handleReturnInventory = (invoice: ServerInvoice) => {
    creditNoteWithReturnManager.open(
      invoice.FGId,
      new Date(invoice.FGFechaCreado),
    );
  };

  const handleDownloadPdf = async (sequence: number) => {
    try {
      setInvoicePdfDownloadingSecuencia(sequence);
      await invoiceApi.downloadInvoicePDF(sequence);
    } catch (err) {
      console.error("Test invoice PDF download failed:", err);
    } finally {
      setInvoicePdfDownloadingSecuencia(null);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => (
    <div className="ml-1 flex flex-col">
      <ChevronUp
        size={10}
        className={cn(
          "-mb-1 cursor-pointer",
          sortKey === columnKey && sortAsc
            ? "text-primary"
            : "text-muted-foreground/50 hover:text-muted-foreground",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSortKey(columnKey);
          setSortAsc(true);
        }}
      />
      <ChevronDown
        size={10}
        className={cn(
          "cursor-pointer",
          sortKey === columnKey && !sortAsc
            ? "text-primary"
            : "text-muted-foreground/50 hover:text-muted-foreground",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSortKey(columnKey);
          setSortAsc(false);
        }}
      />
    </div>
  );

  const sortableHeadClass =
    "cursor-pointer transition-colors hover:bg-muted/50";

  if (isLoading) {
    return <InvoiceTableSkeleton />;
  }

  if (invoices.length === 0) {
    return (
      <InvoiceEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", invoiceListPadding.x)}>
        {displayData.map((invoice) => (
          <InvoiceMobileCard
            key={invoice.FGId}
            invoice={invoice}
            showTestInvoicePdfDownload={showTestInvoicePdfDownload}
            isDownloadingPdf={
              invoicePdfDownloadingSecuencia === invoice.FGOrgSecuencia
            }
            onDownloadPdf={handleDownloadPdf}
            onAddPayment={handleAddPayment}
            onDebitNote={handleDebitNote}
            onCreditNote={handleCreditNote}
            onReturnInventory={handleReturnInventory}
          />
        ))}
      </div>

      <div className={cn("hidden py-4 md:block", invoiceListPadding.x)}>
        <ScrollArea>
          <Table className="w-max min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead
                  className={cn("pl-0", sortableHeadClass)}
                  onClick={() => handleSort("invoiceNumber")}
                >
                  <div className="flex items-center">
                    Invoice <SortIcon columnKey="invoiceNumber" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("originalLoad")}
                >
                  <div className="flex items-center">
                    Type <SortIcon columnKey="originalLoad" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("purchaseOrder")}
                >
                  <div className="flex items-center">
                    PO <SortIcon columnKey="purchaseOrder" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("client")}
                >
                  <div className="flex items-center">
                    Client <SortIcon columnKey="client" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("vendor")}
                >
                  <div className="flex items-center">
                    Vendor <SortIcon columnKey="vendor" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("issuedDate")}
                >
                  <div className="flex items-center">
                    Issued <SortIcon columnKey="issuedDate" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("dueDate")}
                >
                  <div className="flex items-center">
                    Due date <SortIcon columnKey="dueDate" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("due")}
                >
                  <div className="flex items-center">
                    Due <SortIcon columnKey="due" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("totalAmount")}
                >
                  <div className="flex items-center">
                    Total <SortIcon columnKey="totalAmount" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("balance")}
                >
                  <div className="flex items-center">
                    Balance <SortIcon columnKey="balance" />
                  </div>
                </TableHead>
                <TableHead
                  className={sortableHeadClass}
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status <SortIcon columnKey="status" />
                  </div>
                </TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((invoice) => {
                const isActive = invoice.FGEstado === EstadoInvoice.ACTIVE;
                const isOverdue = invoice.FGEstado === EstadoInvoice.OVERDUE;
                const { isOverdue30 } = getDaysFromDueDate(
                  invoice.FGFechaVencimiento,
                );
                const showRedAmounts = (isActive || isOverdue) && isOverdue30;

                return (
                  <TableRow
                    key={invoice.FGId}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-0">
                      <span className="font-medium">#{invoice.FGNro}</span>
                    </TableCell>
                    <TableCell>
                      <InvoiceLoadTypeBadge
                        isBalanceInvoice={Boolean(invoice.FGFacturaDeSaldo)}
                      />
                    </TableCell>
                    <TableCell>{invoice.FGPurchaseOrder || "—"}</TableCell>
                    <TableCell>
                      <span className="line-clamp-2">
                        {invoice.cltemae?.CRazonSocial || "—"}
                      </span>
                    </TableCell>
                    <TableCell>{invoice.vendedor?.VNombre || "—"}</TableCell>
                    <TableCell>
                      {formatearFecha(invoice.FGFechaCreado, {
                        conTiempo: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {formatearFecha(invoice.FGFechaVencimiento, {
                        conTiempo: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <InvoiceDueIndicator
                        dueDate={invoice.FGFechaVencimiento}
                        status={invoice.FGEstado}
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          showRedAmounts
                            ? "font-medium text-red-600 dark:text-red-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatearMoneda(invoice.FGValorTotalNeto)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          showRedAmounts
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground",
                        )}
                      >
                        {formatearMoneda(invoice.FGSaldo)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.FGEstado} />
                    </TableCell>
                    <TableCell className="pr-0">
                      <InvoiceRowActions
                        invoice={invoice}
                        showTestInvoicePdfDownload={showTestInvoicePdfDownload}
                        isDownloadingPdf={
                          invoicePdfDownloadingSecuencia ===
                          invoice.FGOrgSecuencia
                        }
                        onDownloadPdf={handleDownloadPdf}
                        onAddPayment={handleAddPayment}
                        onDebitNote={handleDebitNote}
                        onCreditNote={handleCreditNote}
                        onReturnInventory={handleReturnInventory}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <InvoicePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />

      <PaymentFormModal
        isOpen={paymentManager.isOpen}
        onClose={paymentManager.close}
        form={paymentManager.form}
        onSubmit={paymentManager.onSubmit}
        isLoading={paymentManager.isMutating}
        invoiceCreatedAt={paymentManager.invoiceCreatedAt}
      />

      <DebitNoteFormModal
        isOpen={debitNoteManager.isOpen}
        onClose={debitNoteManager.close}
        form={debitNoteManager.form}
        onSubmit={debitNoteManager.onSubmit}
        isLoading={debitNoteManager.isMutating}
        invoiceCreatedAt={debitNoteManager.invoiceCreatedAt}
      />

      <CreditNoteFormModal
        isOpen={creditNoteManager.isOpen}
        onClose={creditNoteManager.close}
        form={creditNoteManager.form}
        onSubmit={creditNoteManager.onSubmit}
        isLoading={creditNoteManager.isMutating}
        invoiceCreatedAt={creditNoteManager.invoiceCreatedAt}
      />

      {invoices.length > 0 ? (
        <CreditNoteWithReturnDialog
          open={creditNoteWithReturnManager.isOpen}
          onOpenChange={creditNoteWithReturnManager.close}
          invoiceId={creditNoteWithReturnManager.invoiceId || 0}
          form={creditNoteWithReturnManager.form}
          onSubmit={creditNoteWithReturnManager.onSubmit}
          isLoading={creditNoteWithReturnManager.isMutating}
          invoiceCreatedAt={creditNoteWithReturnManager.invoiceCreatedAt}
        />
      ) : null}
    </div>
  );
}
