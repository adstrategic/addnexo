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
import { getPageNumbers, cn } from "@/lib/utils";
import type { BankResponse } from "../schemas/BankSchema";
import { bankListPadding } from "./layout/bank-list-layout";
import { BankEmptyState } from "./BankEmptyState";
import { BankMobileCard } from "./BankMobileCard";
import { BankRowActions } from "./BankRowActions";
import { BankTableSkeleton } from "./BankTableSkeleton";

interface BankTableProps {
  banks: BankResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  onEdit: (sequence: number) => void;
  onDelete: (sequence: number, nombre: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}

function BankPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  BankTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        bankListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "bank" : "banks"}
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

export function BankTable({
  banks,
  isLoading,
  isFetching = false,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
  onCreate,
}: BankTableProps) {
  if (isLoading) {
    return <BankTableSkeleton />;
  }

  if (banks.length === 0) {
    return (
      <BankEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", bankListPadding.x)}>
        {banks.map((bank) => (
          <BankMobileCard
            key={bank.BId}
            bank={bank}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", bankListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Bank Name</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banks.map((bank) => (
                <TableRow
                  key={bank.BId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0 font-medium">
                    {bank.BNombre}
                  </TableCell>
                  <TableCell className="pr-0">
                    <BankRowActions
                      bank={bank}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <BankPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
