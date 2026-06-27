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
import { formatearFecha, formatearMoneda, getPageNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { InvoiceStatusBadge } from "@/features/invoices/components/InvoiceStatusBadge";
import type { CreditNoteResponse } from "../schemas/credit-note-response.schema";
import { CreditNoteEmptyState } from "./CreditNoteEmptyState";
import { CreditNoteMobileCard } from "./CreditNoteMobileCard";
import { CreditNoteRowActions } from "./CreditNoteRowActions";
import { CreditNoteTableSkeleton } from "./CreditNoteTableSkeleton";
import { creditNoteListPadding } from "./layout/credit-note-list-layout";

interface CreditNoteTableProps {
  creditNotes: CreditNoteResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function CreditNotePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  CreditNoteTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        creditNoteListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "credit note" : "credit notes"}
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

export function CreditNoteTable({
  creditNotes,
  isLoading,
  isFetching = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: CreditNoteTableProps) {
  if (isLoading) {
    return <CreditNoteTableSkeleton />;
  }

  if (creditNotes.length === 0) {
    return (
      <CreditNoteEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", creditNoteListPadding.x)}>
        {creditNotes.map((note) => (
          <CreditNoteMobileCard key={note.MCId} note={note} />
        ))}
      </div>

      <div className={cn("hidden md:block", creditNoteListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Credit note</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Invoice status</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.map((note) => (
                <TableRow
                  key={note.MCId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0 font-medium">
                    {note.MCNroDocumento}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/invoices/${note.facturag.FGOrgSecuencia}`}
                      className="text-primary transition-colors hover:text-primary/80"
                    >
                      #{note.facturag.FGNro}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-2">
                      {note.facturag.cltemae.CRazonSocial}
                    </span>
                  </TableCell>
                  <TableCell>
                    {note.MCFecha
                      ? formatearFecha(note.MCFecha, { conTiempo: false })
                      : "—"}
                  </TableCell>
                  <TableCell className="font-medium text-red-600 dark:text-red-400">
                    {formatearMoneda(Number(note.MCValor))}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={note.facturag.FGEstado} />
                  </TableCell>
                  <TableCell className="pr-0">
                    <CreditNoteRowActions note={note} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreditNotePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
