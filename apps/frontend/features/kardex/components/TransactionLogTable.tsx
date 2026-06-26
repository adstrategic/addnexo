"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  History,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type {
  KardexTableServerPagination,
  KardexTransaction,
} from "../schemas/KardexSchemas";

interface TransactionLogTableProps {
  transactions: KardexTransaction[];
  selectedProduct: string | null;
  selectedLotLabel: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  serverPagination?: KardexTableServerPagination;
}

type SortKey =
  | "date"
  | "lote"
  | "documentNumber"
  | "costPrice"
  | "quantity"
  | "productDescription";

const DEFAULT_PAGE_SIZE = 10;

const usd = (value: number) =>
  `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function sortTransactions(
  items: KardexTransaction[],
  sortKey: SortKey,
  sortAsc: boolean,
): KardexTransaction[] {
  return [...items].sort((a, b) => {
    let aVal: string | number = a[sortKey] ?? 0;
    let bVal: string | number = b[sortKey] ?? 0;

    if (sortKey === "date") {
      aVal = Date.parse(a.date);
      bVal = Date.parse(b.date);
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });
}

export function TransactionLogTable({
  transactions,
  selectedProduct,
  selectedLotLabel,
  searchQuery,
  onSearchChange,
  isLoading,
  isFetching = false,
  serverPagination,
}: TransactionLogTableProps) {
  const getTypeLabel = (transaction: KardexTransaction) =>
    transaction.typeLabel ?? (transaction.type === 1 ? "Entry" : "Exit");

  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const isServerMode = Boolean(serverPagination);
  const page = serverPagination?.page ?? 1;
  const totalPages = serverPagination?.totalPages ?? 1;
  const totalItems = serverPagination?.totalItems ?? transactions.length;
  const pageSize =
    serverPagination?.pageSize ??
    (totalPages > 0
      ? Math.max(1, Math.ceil(totalItems / totalPages))
      : DEFAULT_PAGE_SIZE);

  const displayData = useMemo(
    () => sortTransactions(transactions, sortKey, sortAsc),
    [transactions, sortKey, sortAsc],
  );

  const rowOffset = isServerMode ? (page - 1) * pageSize : 0;

  const showingFrom =
    totalItems === 0 || displayData.length === 0 ? 0 : rowOffset + 1;
  const showingTo = isServerMode
    ? rowOffset + displayData.length
    : displayData.length;

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => (
    <div className="ml-1 flex flex-col">
      <ChevronUp
        size={10}
        className={cn(
          "-mb-1 cursor-pointer",
          sortKey === columnKey && sortAsc
            ? "text-primary"
            : "text-muted-foreground/60 hover:text-muted-foreground",
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
            : "text-muted-foreground/60 hover:text-muted-foreground",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setSortKey(columnKey);
          setSortAsc(false);
        }}
      />
    </div>
  );

  const getRowStyle = (transaction: KardexTransaction) => {
    if (transaction.isPendingCostZero) {
      return "bg-amber-50 border-l-2 border-l-amber-500 dark:bg-amber-950/30";
    }
    if (getTypeLabel(transaction) === "Exit") {
      return "bg-destructive/5 border-l-2 border-l-destructive";
    }
    return "bg-primary/5 border-l-2 border-l-primary";
  };

  const headerCls =
    "py-2.5 px-4 font-semibold text-foreground text-[11px] uppercase tracking-wider cursor-pointer hover:bg-accent/50";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 border-b bg-muted p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <History size={18} className="text-foreground" />
          <h2 className="text-[14px] font-semibold text-foreground">
            Transaction Log{" "}
            {selectedLotLabel
              ? `— Lote ${selectedLotLabel}`
              : selectedProduct
                ? ""
                : "— All products"}
          </h2>
        </div>

        <div className="flex w-full items-center gap-4 sm:w-auto">
          <span className="hidden whitespace-nowrap text-[12px] font-medium text-muted-foreground sm:inline">
            {isLoading
              ? "Loading..."
              : `Showing ${showingFrom}-${showingTo} of ${totalItems}`}
          </span>
          <div className="relative flex-1 sm:w-[300px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search by lot, customer or supplier..."
              className="h-8 bg-card pl-8 text-[12px]"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60">
            <p className="text-xs font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        )}
        <table className="w-full min-w-[1200px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b bg-muted">
            <tr>
              <th className="w-[40px] px-4 py-2.5 text-[11px] font-medium text-muted-foreground">
                #
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Type
              </th>
              <th
                className={cn(headerCls, "min-w-[180px]")}
                onClick={() => handleSort("productDescription")}
              >
                <div className="flex items-center">
                  Product <SortIcon columnKey="productDescription" />
                </div>
              </th>
              <th className={headerCls} onClick={() => handleSort("lote")}>
                <div className="flex items-center">
                  Lot <SortIcon columnKey="lote" />
                </div>
              </th>
              <th
                className={headerCls}
                onClick={() => handleSort("documentNumber")}
              >
                <div className="flex items-center">
                  Document # <SortIcon columnKey="documentNumber" />
                </div>
              </th>
              <th className={headerCls} onClick={() => handleSort("date")}>
                <div className="flex items-center">
                  Date <SortIcon columnKey="date" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("quantity")}
              >
                <div className="flex items-center justify-end">
                  Quantity <SortIcon columnKey="quantity" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("costPrice")}
              >
                <div className="flex items-center justify-end">
                  Cost/Price <SortIcon columnKey="costPrice" />
                </div>
              </th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Supplier/Customer
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((t, idx) => (
              <tr
                key={t.id}
                className={cn(
                  "group border-b transition-colors hover:bg-accent/30",
                  getRowStyle(t),
                )}
              >
                <td className="px-4 py-2.5 text-[11px] text-muted-foreground">
                  {isServerMode ? rowOffset + idx + 1 : idx + 1}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "w-fit rounded-full px-2 py-0.5 text-sm font-semibold",
                        getTypeLabel(t) === "Entry"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {getTypeLabel(t) === "Entry" ? "↗ Entry" : "↙ Exit"}
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      {t.transac}
                    </span>
                  </div>
                </td>
                <td className="max-w-[240px] px-4 py-2.5 text-sm font-medium text-foreground">
                  <span className="line-clamp-2" title={t.productDescription}>
                    {t.productDescription || "-"}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-sm font-semibold text-primary">
                  {t.lote ?? "-"}
                </td>
                <td className="px-4 py-2.5 font-mono text-sm text-muted-foreground">
                  {t.documentNumber ?? "-"}
                </td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">
                  {t.date}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm text-foreground/80">
                  {t.quantity.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {getTypeLabel(t) === "Exit" ? (
                    <div className="inline-flex flex-col items-end text-sm leading-tight text-muted-foreground">
                      <span>
                        Average cost:
                        <span className="ml-1 font-mono font-semibold text-destructive">
                          {usd(t.costPrice ?? 0)}
                        </span>
                      </span>
                      <span className="mt-1">
                        Sale price:
                        <span className="ml-1 font-mono font-semibold text-foreground">
                          {usd(t.salePrice ?? 0)}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex flex-col items-end">
                      <span
                        className={cn(
                          "font-mono text-sm font-bold",
                          t.isPendingCostZero
                            ? "text-amber-600 dark:text-amber-500"
                            : "text-primary",
                        )}
                      >
                        {usd(t.costPrice ?? 0)}
                      </span>
                      {t.isPendingCostZero && (
                        <span className="mt-1 text-[10px] text-amber-600 dark:text-amber-500">
                          Pending definitive cost
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[12px] font-medium text-foreground">
                  {t.csmSppl}
                </td>
              </tr>
            ))}
            {!isLoading && displayData.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No transactions match your search.
                </td>
              </tr>
            )}
            {isLoading && displayData.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Loading movements...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {serverPagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-card p-3">
          <div className="px-2 text-[12px] text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => serverPagination.onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading || isFetching}
              className="h-8"
            >
              <ChevronLeft size={14} className="mr-1" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                serverPagination.onPageChange(Math.min(totalPages, page + 1))
              }
              disabled={page === totalPages || isLoading || isFetching}
              className="h-8"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
