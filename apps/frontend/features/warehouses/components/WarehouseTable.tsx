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
import { getPageNumbers, cn } from "@/lib/utils";
import type { AlmacenResponse } from "../schemas/almacenes.schema";
import { warehouseListPadding } from "./layout/warehouse-list-layout";
import { WarehouseEmptyState } from "./WarehouseEmptyState";
import { WarehouseMobileCard } from "./WarehouseMobileCard";
import { WarehouseRowActions } from "./WarehouseRowActions";
import { WarehouseTableSkeleton } from "./WarehouseTableSkeleton";

interface WarehouseTableProps {
  almacenes: AlmacenResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  onEdit: (sequence: number) => void;
  onDelete: (warehouse: AlmacenResponse) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}

function WarehousePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  WarehouseTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        warehouseListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "warehouse" : "warehouses"}
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

export function WarehouseTable({
  almacenes,
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
}: WarehouseTableProps) {
  if (isLoading) {
    return <WarehouseTableSkeleton />;
  }

  if (almacenes.length === 0) {
    return (
      <WarehouseEmptyState
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
      <div className={cn("space-y-3 py-4 md:hidden", warehouseListPadding.x)}>
        {almacenes.map((almacen) => (
          <WarehouseMobileCard
            key={almacen.ALId}
            warehouse={almacen}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", warehouseListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Warehouse</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {almacenes.map((almacen) => (
                <TableRow
                  key={almacen.ALId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <div className="space-y-1">
                      <Link
                        href={`/warehouses/${almacen.ALOrgSecuencia}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {almacen.ALNombre}
                      </Link>
                      {almacen.ALDireccion ? (
                        <p className="text-xs text-muted-foreground">
                          {almacen.ALDireccion}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{almacen.ALResponsable}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <p>{almacen.ciudad?.nombre ?? "—"}</p>
                      <p className="text-muted-foreground">
                        {almacen.ciudad?.estado?.pais?.nombre ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {almacen.ALTelefono ? (
                      <a
                        href={`tel:${almacen.ALTelefono}`}
                        className="text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        {almacen.ALTelefono}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="pr-0">
                    <WarehouseRowActions
                      sequence={almacen.ALOrgSecuencia}
                      warehouse={almacen}
                      warehouseName={almacen.ALNombre}
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

      <WarehousePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
