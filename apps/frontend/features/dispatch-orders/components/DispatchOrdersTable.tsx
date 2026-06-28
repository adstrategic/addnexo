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
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { formatearFecha, formatearMoneda, getPageNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { useDispatchOrderToInvoice } from "../hooks/useDispatchOrderToInvoice";
import { useDispatchOrderAnnulment } from "../hooks/useDispatchOrderAnnulment";
import { useRegenerateEmittedDispatchPdf } from "../hooks/useDispatchOrders";
import { DispatchOrderDialog } from "./DispatchOrderDialog";
import { DispatchOrderReturnDialog } from "./DispatchOrderReturnDialog";
import { DispatchOrderToInvoiceModal } from "./DispatchOrderToInvoiceModal";
import { DispatchOrderAnnulModal } from "./DispatchOrderAnnulModal";
import { DispatchOrderEmptyState } from "./DispatchOrderEmptyState";
import { DispatchOrderMobileCard } from "./DispatchOrderMobileCard";
import { DispatchOrderRowActions } from "./DispatchOrderRowActions";
import { DispatchOrderStatusBadge } from "./DispatchOrderStatusBadge";
import { DispatchOrderTableSkeleton } from "./DispatchOrderTableSkeleton";
import { dispatchOrderListPadding } from "./layout/dispatch-order-list-layout";

interface DispatchOrdersTableProps {
  dispatchOrders: DispatchOrderResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  onDelete?: (payload: { sequence: number; number: number }) => void;
  onDispatch?: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function DispatchOrderPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  DispatchOrdersTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        dispatchOrderListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "dispatch order" : "dispatch orders"}
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

export function DispatchOrdersTable({
  dispatchOrders,
  isLoading,
  isFetching = false,
  onDelete,
  onDispatch,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: DispatchOrdersTableProps) {
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedDispatchOrderSequence, setSelectedDispatchOrderSequence] =
    useState<number | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedDispatchOrderForReturn, setSelectedDispatchOrderForReturn] =
    useState<DispatchOrderResponse | null>(null);
  const [regeneratingPdfSecuencia, setRegeneratingPdfSecuencia] = useState<
    number | null
  >(null);

  const invoiceConversion = useDispatchOrderToInvoice();
  const annulment = useDispatchOrderAnnulment();
  const regenerateEmittedPdf = useRegenerateEmittedDispatchPdf();
  const { can } = useRole();
  const canViewPrices = can({ dispatchOrder: ["read"] });

  const handleDispatch = (sequence: number) => {
    setSelectedDispatchOrderSequence(sequence);
    setDispatchDialogOpen(true);
  };

  const handleReturn = (dispatchOrder: DispatchOrderResponse) => {
    setSelectedDispatchOrderForReturn(dispatchOrder);
    setReturnDialogOpen(true);
  };

  const handleRegeneratePdf = (sequence: number) => {
    setRegeneratingPdfSecuencia(sequence);
    regenerateEmittedPdf.mutate(sequence, {
      onSuccess: () => {
        toast.success("PDF updated", {
          description:
            "The warehouse has been sent the updated dispatch PDF.",
        });
      },
      onError: (err: unknown) => {
        toast.error("Regeneration failed", {
          description:
            err instanceof Error
              ? err.message
              : "Could not regenerate the dispatch PDF.",
        });
      },
      onSettled: () => {
        setRegeneratingPdfSecuencia(null);
      },
    });
  };

  if (isLoading) {
    return <DispatchOrderTableSkeleton />;
  }

  if (dispatchOrders.length === 0) {
    return (
      <DispatchOrderEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", dispatchOrderListPadding.x)}>
        {dispatchOrders.map((dispatchOrder) => (
          <DispatchOrderMobileCard
            key={dispatchOrder.DOGId}
            dispatchOrder={dispatchOrder}
            canViewPrices={canViewPrices}
            onDelete={onDelete}
            onDispatch={handleDispatch}
            onReturn={handleReturn}
            onConvertToInvoice={invoiceConversion.openModal}
            onAnnul={annulment.openModal}
            onRegeneratePdf={handleRegeneratePdf}
            isRegeneratingPdf={
              regenerateEmittedPdf.isPending &&
              regeneratingPdfSecuencia === dispatchOrder.DOGOrgSecuencia
            }
          />
        ))}
      </div>

      <div className={cn("hidden md:block", dispatchOrderListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Order</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                {canViewPrices ? <TableHead>Total</TableHead> : null}
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatchOrders.map((dispatchOrder) => (
                <TableRow
                  key={dispatchOrder.DOGId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <div className="space-y-1">
                      <Link
                        href={`/dispatch-orders/${dispatchOrder.DOGOrgSecuencia}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        #{dispatchOrder.DOGNro}
                      </Link>
                      {dispatchOrder.DOGPurchaseOrder ? (
                        <p className="text-xs text-muted-foreground">
                          PO {dispatchOrder.DOGPurchaseOrder}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2">
                      {dispatchOrder.cltemae?.CRazonSocial || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {formatearFecha(dispatchOrder.DOGFechaCreado, {
                      conTiempo: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {dispatchOrder.vendedor?.VNombre || "N/A"}
                  </TableCell>
                  {canViewPrices ? (
                    <TableCell>
                      {formatearMoneda(
                        Number(dispatchOrder.DOGValorTotalNeto ?? 0),
                      )}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <DispatchOrderStatusBadge status={dispatchOrder.DOGEstado} />
                  </TableCell>
                  <TableCell className="pr-0">
                    <DispatchOrderRowActions
                      dispatchOrder={dispatchOrder}
                      onDelete={onDelete}
                      onDispatch={handleDispatch}
                      onReturn={handleReturn}
                      onConvertToInvoice={invoiceConversion.openModal}
                      onAnnul={annulment.openModal}
                      onRegeneratePdf={handleRegeneratePdf}
                      isRegeneratingPdf={
                        regenerateEmittedPdf.isPending &&
                        regeneratingPdfSecuencia ===
                          dispatchOrder.DOGOrgSecuencia
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DispatchOrderPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />

      {selectedDispatchOrderSequence !== null ? (
        <DispatchOrderDialog
          open={dispatchDialogOpen}
          onOpenChange={(open) => {
            setDispatchDialogOpen(open);
            if (!open) setSelectedDispatchOrderSequence(null);
          }}
          dispatchOrderSequence={selectedDispatchOrderSequence}
          onSuccess={() => onDispatch?.()}
        />
      ) : null}

      {selectedDispatchOrderForReturn ? (
        <DispatchOrderReturnDialog
          open={returnDialogOpen}
          onOpenChange={(open) => {
            setReturnDialogOpen(open);
            if (!open) setSelectedDispatchOrderForReturn(null);
          }}
          dispatchOrder={selectedDispatchOrderForReturn}
        />
      ) : null}

      {invoiceConversion.selectedDispatchOrder ? (
        <DispatchOrderToInvoiceModal
          isOpen={invoiceConversion.isModalOpen}
          onClose={invoiceConversion.closeModal}
          onConfirm={invoiceConversion.handleConfirm}
          dispatchOrder={invoiceConversion.selectedDispatchOrder}
          isCreating={invoiceConversion.isCreating}
        />
      ) : null}

      {annulment.selectedDispatchOrder ? (
        <DispatchOrderAnnulModal
          isOpen={annulment.isModalOpen}
          onClose={annulment.closeModal}
          onConfirm={annulment.handleConfirm}
          dispatchOrder={annulment.selectedDispatchOrder}
          isAnulling={annulment.isAnulling}
        />
      ) : null}
    </div>
  );
}
