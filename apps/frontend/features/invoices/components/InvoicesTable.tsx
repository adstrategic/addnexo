"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Eye,
  MoreHorizontal,
  RotateCcw,
  DollarSign,
  FileText,
  Download,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import invoiceApi from "../services/invoices.api";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  EstadoInvoice,
  ServerInvoice,
} from "../schemas/invoices-response.schema";
import { useMemo, useState } from "react";
import {
  cn,
  formatearFecha,
  formatearMoneda,
  getDaysFromDueDate,
} from "@/lib/utils";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DispatchOrdersTableProps {
  invoices: ServerInvoice[];
  isLoading: boolean;
  onDelete?: (invoice: { sequence: number; number: number }) => void;
  /** TODO(test): remove — dev-only invoice PDF download per row */
  showTestInvoicePdfDownload?: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
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

export const InvoicesTable = ({
  invoices,
  isLoading,
  showTestInvoicePdfDownload = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: DispatchOrdersTableProps) => {
  const [invoicePdfDownloadingSecuencia, setInvoicePdfDownloadingSecuencia] =
    useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("issuedDate");
  const [sortAsc, setSortAsc] = useState(false);

  // Payment and Debit Note managers
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

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => (
    <div className="flex flex-col ml-1">
      <ChevronUp
        size={10}
        className={cn(
          "-mb-1 cursor-pointer",
          sortKey === columnKey && sortAsc
            ? "text-[#1B5E3C]"
            : "text-gray-400 hover:text-gray-600",
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
            ? "text-[#1B5E3C]"
            : "text-gray-400 hover:text-gray-600",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSortKey(columnKey);
          setSortAsc(false);
        }}
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invoices found
      </div>
    );
  }

  return (
    <div className="py-4">
      <ScrollArea>
        <Table className="w-max">
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("invoiceNumber")}
              >
                <div className="flex items-center">
                  Invoice Number <SortIcon columnKey="invoiceNumber" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("originalLoad")}
              >
                <div className="flex items-center">
                  Original Load <SortIcon columnKey="originalLoad" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("purchaseOrder")}
              >
                <div className="flex items-center">
                  Purchase Order <SortIcon columnKey="purchaseOrder" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("client")}
              >
                <div className="flex items-center">
                  Client <SortIcon columnKey="client" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("vendor")}
              >
                <div className="flex items-center">
                  Vendor <SortIcon columnKey="vendor" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("issuedDate")}
              >
                <div className="flex items-center">
                  Issued Date <SortIcon columnKey="issuedDate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("dueDate")}
              >
                <div className="flex items-center">
                  Due Date <SortIcon columnKey="dueDate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("due")}
              >
                <div className="flex items-center">
                  Due <SortIcon columnKey="due" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("totalAmount")}
              >
                <div className="flex items-center">
                  Total Amount <SortIcon columnKey="totalAmount" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("balance")}
              >
                <div className="flex items-center">
                  Balance <SortIcon columnKey="balance" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status <SortIcon columnKey="status" />
                </div>
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((invoice) => {
              const isActive = invoice.FGEstado === EstadoInvoice.ACTIVE;
              const isPaid = invoice.FGEstado === EstadoInvoice.PAID;
              const isOverdue = invoice.FGEstado === EstadoInvoice.OVERDUE;
              const isAnulated = invoice.FGEstado === EstadoInvoice.ANULATED;
              const { days: daysFromDue, isOverdue30 } = getDaysFromDueDate(
                invoice.FGFechaVencimiento,
              );
              const showRedAmounts = (isActive || isOverdue) && isOverdue30;

              const getStatusBadgeVariant = () => {
                if (isActive) return "outline";
                if (isPaid) return "default";
                if (isOverdue) return "default";
                if (isAnulated) return "destructive";
                return "default";
              };

              const getStatusBadgeClassName = () => {
                if (isActive) return "border-yellow-500 text-yellow-700";
                if (isPaid) return "bg-blue-600 text-white";
                if (isOverdue) return "bg-red-600 text-white";
                if (isAnulated) return "bg-gray-600 text-white";
              };

              return (
                <TableRow key={invoice.FGId}>
                  <TableCell className="font-medium">
                    #{invoice.FGNro}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        invoice.FGFacturaDeSaldo
                          ? "bg-blue-700 text-white"
                          : "bg-green-700 text-white"
                      }
                    >
                      {invoice.FGFacturaDeSaldo
                        ? "Balance invoice"
                        : "Dispatch order"}
                    </Badge>
                  </TableCell>
                  <TableCell>{invoice.FGPurchaseOrder || "N/A"}</TableCell>
                  <TableCell>
                    {invoice.cltemae.CRazonSocial
                      ? `${invoice.cltemae.CRazonSocial}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{invoice.vendedor?.VNombre || "N/A"}</TableCell>
                  <TableCell>
                    {formatearFecha(invoice.FGFechaCreado, { conTiempo: true })}
                  </TableCell>
                  <TableCell>
                    {formatearFecha(invoice.FGFechaVencimiento, {
                      conTiempo: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {isPaid ? (
                      "Paid"
                    ) : daysFromDue === null ? (
                      "—"
                    ) : daysFromDue < 0 ? (
                      <span className="text-blue-600">
                        (-{Math.abs(daysFromDue)})
                      </span>
                    ) : (
                      <span className="text-red-600">({daysFromDue})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        showRedAmounts
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {formatearMoneda(invoice.FGValorTotalNeto)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        showRedAmounts
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {formatearMoneda(invoice.FGSaldo)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant()}
                      className={getStatusBadgeClassName()}
                    >
                      {invoice.FGEstado}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            className="text-green-800"
                            href={`/invoices/${invoice.FGOrgSecuencia}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        {showTestInvoicePdfDownload && (
                          <DropdownMenuItem
                            className="text-muted-foreground"
                            disabled={invoicePdfDownloadingSecuencia !== null}
                            onClick={async () => {
                              try {
                                setInvoicePdfDownloadingSecuencia(
                                  invoice.FGOrgSecuencia,
                                );
                                await invoiceApi.downloadInvoicePDF(
                                  invoice.FGOrgSecuencia,
                                );
                              } catch (err) {
                                console.error(
                                  "Test invoice PDF download failed:",
                                  err,
                                );
                              } finally {
                                setInvoicePdfDownloadingSecuencia(null);
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download invoice PDF (test)
                          </DropdownMenuItem>
                        )}
                        {/* Only show transaction menu items if invoice is not PAID */}
                        {!isPaid && (
                          <>
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() =>
                                paymentManager.open(
                                  invoice.FGId,
                                  new Date(invoice.FGFechaCreado),
                                  invoice.FGPago,
                                )
                              }
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Add payment
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-orange-600"
                              onClick={() =>
                                debitNoteManager.open(
                                  invoice.FGId,
                                  new Date(invoice.FGFechaCreado),
                                )
                              }
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Debit Note
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-blue-600"
                              onClick={() =>
                                creditNoteManager.open(
                                  invoice.FGId,
                                  new Date(invoice.FGFechaCreado),
                                )
                              }
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Credit Note
                            </DropdownMenuItem>

                            {!invoice.FGFacturaDeSaldo && (
                              <DropdownMenuItem
                                className="text-purple-600"
                                onClick={() =>
                                  creditNoteWithReturnManager.open(
                                    invoice.FGId,
                                    new Date(invoice.FGFechaCreado),
                                  )
                                }
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Return inventory
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination Controls */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
        emptyMessage="No invoices found"
        itemLabel="invoices"
      />

      {/* Dispatch Dialog */}
      {/* {selectedDispatchOrderSequence !== null && (
        <InvoiceDialog
          open={dispatchDialogOpen}
          onOpenChange={(open) => {
            setDispatchDialogOpen(open);
            if (!open) {
              setSelectedDispatchOrderSequence(null);
            }
          }}
          dispatchOrderSequence={selectedDispatchOrderSequence}
          onSuccess={() => {
            onDispatch?.();
          }}
        />
      )} */}

      {/* Payment Modal */}
      <PaymentFormModal
        isOpen={paymentManager.isOpen}
        onClose={paymentManager.close}
        form={paymentManager.form}
        onSubmit={paymentManager.onSubmit}
        isLoading={paymentManager.isMutating}
        invoiceCreatedAt={paymentManager.invoiceCreatedAt}
      />

      {/* Debit Note Modal */}
      <DebitNoteFormModal
        isOpen={debitNoteManager.isOpen}
        onClose={debitNoteManager.close}
        form={debitNoteManager.form}
        onSubmit={debitNoteManager.onSubmit}
        isLoading={debitNoteManager.isMutating}
        invoiceCreatedAt={debitNoteManager.invoiceCreatedAt}
      />

      {/* Credit Note Modal */}
      <CreditNoteFormModal
        isOpen={creditNoteManager.isOpen}
        onClose={creditNoteManager.close}
        form={creditNoteManager.form}
        onSubmit={creditNoteManager.onSubmit}
        isLoading={creditNoteManager.isMutating}
        invoiceCreatedAt={creditNoteManager.invoiceCreatedAt}
      />

      {/* Credit Note with Return Dialog */}
      {invoices.length > 0 && (
        <CreditNoteWithReturnDialog
          open={creditNoteWithReturnManager.isOpen}
          onOpenChange={creditNoteWithReturnManager.close}
          invoiceId={creditNoteWithReturnManager.invoiceId || 0}
          form={creditNoteWithReturnManager.form}
          onSubmit={creditNoteWithReturnManager.onSubmit}
          isLoading={creditNoteWithReturnManager.isMutating}
          invoiceCreatedAt={creditNoteWithReturnManager.invoiceCreatedAt}
        />
      )}
    </div>
  );
};
