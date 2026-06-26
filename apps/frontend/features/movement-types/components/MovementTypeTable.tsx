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
import { Badge } from "@/components/ui/badge";
import { getPageNumbers, cn } from "@/lib/utils";
import type { TipoMovimiento } from "../types/server-types";
import { movementTypeListPadding } from "./layout/movement-type-list-layout";
import { MovementTypeEmptyState } from "./MovementTypeEmptyState";
import { MovementTypeMobileCard } from "./MovementTypeMobileCard";
import { MovementTypeRowActions } from "./MovementTypeRowActions";
import { MovementTypeTableSkeleton } from "./MovementTypeTableSkeleton";
import {
  getBooleanBadgeVariant,
  getBooleanDisplayText,
  getMovementTypeDescription,
} from "../lib/utils";

interface MovementTypeTableProps {
  tiposMovimiento: TipoMovimiento[];
  isLoading: boolean;
  isFetching?: boolean;
  onEdit: (movementType: TipoMovimiento) => void;
  onDelete: (id: number, descripcion: string, sequence: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}

function MovementTypePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  MovementTypeTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        movementTypeListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "movement type" : "movement types"}
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

export function MovementTypeTable({
  tiposMovimiento,
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
}: MovementTypeTableProps) {
  if (isLoading) {
    return <MovementTypeTableSkeleton />;
  }

  if (tiposMovimiento.length === 0) {
    return (
      <MovementTypeEmptyState
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
      <div
        className={cn("space-y-3 py-4 md:hidden", movementTypeListPadding.x)}
      >
        {tiposMovimiento.map((movementType) => (
          <MovementTypeMobileCard
            key={movementType.TId}
            movementType={movementType}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", movementTypeListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Movement Type</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Abbrev.</TableHead>
                <TableHead>Affects</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiposMovimiento.map((movementType) => (
                <TableRow
                  key={movementType.TId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <div className="space-y-1">
                      <Link
                        href={`/movement-types/${movementType.TOrgSecuencia}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {movementType.TDescripcion}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {getMovementTypeDescription(movementType.TTipo)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{movementType.TClase}</TableCell>
                  <TableCell>{movementType.TAbreviatura}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getBooleanBadgeVariant(movementType.TAfecta)}
                    >
                      {getBooleanDisplayText(movementType.TAfecta)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getBooleanBadgeVariant(movementType.TPedido)}
                    >
                      {getBooleanDisplayText(movementType.TPedido)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getBooleanBadgeVariant(movementType.TFactura)}
                    >
                      {getBooleanDisplayText(movementType.TFactura)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getBooleanBadgeVariant(movementType.TProv)}
                    >
                      {getBooleanDisplayText(movementType.TProv)}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-0">
                    <MovementTypeRowActions
                      movementType={movementType}
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

      <MovementTypePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
