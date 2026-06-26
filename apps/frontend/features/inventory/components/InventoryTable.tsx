"use client";

import { AlertTriangle, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/shared/TablePagination";
import { cn } from "@/lib/utils";

import type { InventoryKardexTableRow } from "../schemas/InventorySchemas";

export interface InventoryTableServerPagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

/** Footer totals for the kardex table (full filtered dataset from API). */
export interface InventoryTableFooterTotals {
  invEnd: number;
  totalValueAvgCost: number;
  totalValueLastCost: number;
}

interface InventoryTableProps {
  data: InventoryKardexTableRow[];
  serverPagination: InventoryTableServerPagination;
  footerTotals?: InventoryTableFooterTotals;
  searchTerm?: string;
  onSearchTermChange?: (term: string) => void;
}

const formatUsd = (value: number) =>
  `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function InventoryTable({
  data,
  serverPagination,
  footerTotals,
  searchTerm = "",
  onSearchTermChange,
}: InventoryTableProps) {
  const { page, pageSize, totalPages, totalItems, onPageChange } =
    serverPagination;

  const showFooterRow = Boolean(footerTotals && totalItems > 0);

  return (
    <div className="flex flex-col rounded-xl border bg-card shadow-sm transition-all duration-300 hover:border-primary hover:shadow-md">
      <div className="flex items-center justify-between rounded-t-xl border-b bg-muted p-4">
        <div className="relative w-[300px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Search by product, code or group..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange?.(e.target.value)}
            className="bg-card pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">{data.length}</span>{" "}
          of {totalItems} products
          {totalPages > 1 ? ` (page ${page} of ${totalPages})` : null}
        </div>
      </div>

      <div className="max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px] text-center font-medium text-muted-foreground">
                #
              </TableHead>
              <TableHead className="font-medium text-muted-foreground">
                Product
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                Stock
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                Avg unit cost
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                Total value avg cost
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                Last unit cost
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">
                Total value last cost
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No records found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                const isLowStock = item.invEnd < item.minStock;
                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "cursor-default transition-colors hover:bg-accent/50",
                      isLowStock &&
                        "bg-destructive/5 hover:bg-destructive/10",
                    )}
                  >
                    <TableCell className="text-center font-mono text-xs text-muted-foreground/70">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-2">
                          {item.product}
                          {isLowStock && (
                            <Badge className="inline-flex h-5 items-center gap-1 bg-destructive px-1.5 align-middle text-[10px] font-normal uppercase text-destructive-foreground hover:bg-destructive">
                              <AlertTriangle size={10} /> Low Stock
                            </Badge>
                          )}
                        </span>
                        <span className="font-mono text-[10px] font-normal text-muted-foreground">
                          {item.code} • {item.group}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-medium",
                        isLowStock ? "text-destructive" : "text-primary",
                      )}
                    >
                      {item.invEnd.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatUsd(item.avgCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatUsd(item.totalValueAvgCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {formatUsd(item.lastCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground">
                      {formatUsd(item.totalValueLastCost)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {showFooterRow && (
              <TableRow className="border-t-2 bg-secondary font-bold hover:bg-secondary">
                <TableCell
                  colSpan={2}
                  className="text-right text-xs uppercase tracking-wider text-secondary-foreground"
                >
                  Total
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-secondary-foreground">
                  {footerTotals!.invEnd.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  —
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-secondary-foreground">
                  {formatUsd(footerTotals!.totalValueAvgCost)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  —
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-secondary-foreground">
                  {formatUsd(footerTotals!.totalValueLastCost)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="rounded-b-xl border-t bg-card p-3">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={onPageChange}
            itemLabel="products"
          />
        </div>
      )}
    </div>
  );
}
