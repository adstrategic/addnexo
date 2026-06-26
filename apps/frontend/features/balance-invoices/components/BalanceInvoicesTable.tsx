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
import { formatearFecha, formatearMoneda, getPageNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Factura } from "../schemas/BalanceInvoicesResponseSchema";
import { BalanceInvoiceEmptyState } from "./BalanceInvoiceEmptyState";
import { BalanceInvoiceMobileCard } from "./BalanceInvoiceMobileCard";
import { BalanceInvoiceRowActions } from "./BalanceInvoiceRowActions";
import { BalanceInvoiceStatusBadge } from "./BalanceInvoiceStatusBadge";
import { BalanceInvoiceTableSkeleton } from "./BalanceInvoiceTableSkeleton";
import { balanceInvoiceListPadding } from "./layout/balance-invoice-list-layout";

interface BalanceInvoicesTableProps {
  facturas: Factura[];
  isLoading: boolean;
  isFetching?: boolean;
  onDelete?: (payload: { sequence: number; number: number }) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function BalanceInvoicePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  BalanceInvoicesTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        balanceInvoiceListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "balance invoice" : "balance invoices"}
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

export function BalanceInvoicesTable({
  facturas,
  isLoading,
  isFetching = false,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: BalanceInvoicesTableProps) {
  if (isLoading) {
    return <BalanceInvoiceTableSkeleton />;
  }

  if (facturas.length === 0) {
    return (
      <BalanceInvoiceEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div
        className={cn("space-y-3 py-4 md:hidden", balanceInvoiceListPadding.x)}
      >
        {facturas.map((factura) => (
          <BalanceInvoiceMobileCard
            key={factura.FGId}
            factura={factura}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", balanceInvoiceListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Invoice</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturas.map((factura) => {
                const isEditable = factura.movCXC?.length === 0;

                return (
                  <TableRow
                    key={factura.FGId}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-0 font-medium">
                      #{factura.FGNro}
                    </TableCell>
                    <TableCell>{factura.FGPurchaseOrder || "—"}</TableCell>
                    <TableCell>
                      <span className="line-clamp-2">
                        {factura.cltemae?.CRazonSocial || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatearFecha(factura.FGFechaCreado, {
                        conTiempo: true,
                      })}
                    </TableCell>
                    <TableCell>{factura.vendedor?.VNombre || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatearMoneda(Number(factura.FGValorTotalBruto ?? 0))}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatearMoneda(Number(factura.FGSaldo ?? 0))}
                    </TableCell>
                    <TableCell>
                      <BalanceInvoiceStatusBadge status={factura.FGEstado} />
                    </TableCell>
                    <TableCell className="pr-0">
                      <BalanceInvoiceRowActions
                        factura={factura}
                        isEditable={isEditable}
                        onDelete={onDelete}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <BalanceInvoicePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
