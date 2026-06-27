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
import type { DebitNoteResponse } from "../schemas/debit-note-response.schema";
import { DebitNoteEmptyState } from "./DebitNoteEmptyState";
import { DebitNoteMobileCard } from "./DebitNoteMobileCard";
import { DebitNoteRowActions } from "./DebitNoteRowActions";
import { DebitNoteTableSkeleton } from "./DebitNoteTableSkeleton";
import { debitNoteListPadding } from "./layout/debit-note-list-layout";

interface DebitNoteTableProps {
  debitNotes: DebitNoteResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function DebitNotePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  DebitNoteTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        debitNoteListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "debit note" : "debit notes"}
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

export function DebitNoteTable({
  debitNotes,
  isLoading,
  isFetching = false,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: DebitNoteTableProps) {
  if (isLoading) {
    return <DebitNoteTableSkeleton />;
  }

  if (debitNotes.length === 0) {
    return (
      <DebitNoteEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", debitNoteListPadding.x)}>
        {debitNotes.map((note) => (
          <DebitNoteMobileCard key={note.MCId} note={note} />
        ))}
      </div>

      <div className={cn("hidden md:block", debitNoteListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Debit note</TableHead>
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
              {debitNotes.map((note) => (
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
                  <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatearMoneda(Number(note.MCValor))}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge status={note.facturag.FGEstado} />
                  </TableCell>
                  <TableCell className="pr-0">
                    <DebitNoteRowActions note={note} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <DebitNotePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
