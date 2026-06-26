"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type {
  KardexLot,
  KardexProduct,
  KardexTableServerPagination,
} from "../schemas/KardexSchemas";

type SortKey =
  | "origen"
  | "lote"
  | "documento"
  | "productName"
  | "invIni"
  | "inputs"
  | "outputs"
  | "invEnd";

interface LotDetailTableProps {
  lots: KardexLot[];
  selectedProductData: KardexProduct | null;
  selectedLot: string | null;
  onSelectLot: (id: string | null) => void;
  serverPagination: KardexTableServerPagination;
  isFetching?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function LotDetailTable({
  lots,
  selectedProductData,
  selectedLot,
  onSelectLot,
  serverPagination,
  isFetching = false,
  searchQuery,
  onSearchChange,
}: LotDetailTableProps) {
  const { page, totalPages, totalItems, onPageChange } = serverPagination;
  const [sortKey, setSortKey] = useState<SortKey>("invEnd");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const displayData = useMemo(() => {
    return [...lots].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [lots, sortKey, sortAsc]);

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

  const headerCls =
    "py-2 px-4 font-semibold text-foreground text-[11px] uppercase tracking-wider cursor-pointer hover:bg-accent/50";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-l-4 border-l-primary bg-card shadow-sm transition-all duration-300">
      <div className="flex flex-col items-start justify-between gap-3 border-b bg-muted p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded bg-primary px-3 py-1 text-[12px] font-medium text-primary-foreground">
            {selectedProductData?.name ?? "All Products"}
          </div>
          <span className="text-[13px] font-medium text-muted-foreground">
            Lot breakdown
          </span>
        </div>
        <div className="relative w-full sm:w-[260px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search by lot or document #..."
            className="h-8 bg-card pl-8 text-[12px]"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {isFetching && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60">
            <p className="text-xs font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        )}
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b bg-muted">
            <tr>
              <th className={headerCls} onClick={() => handleSort("origen")}>
                <div className="flex items-center">
                  Origin <SortIcon columnKey="origen" />
                </div>
              </th>
              <th className={headerCls} onClick={() => handleSort("lote")}>
                <div className="flex items-center">
                  Lot <SortIcon columnKey="lote" />
                </div>
              </th>
              <th className={headerCls} onClick={() => handleSort("documento")}>
                <div className="flex items-center">
                  Document # <SortIcon columnKey="documento" />
                </div>
              </th>
              <th
                className={headerCls}
                onClick={() => handleSort("productName")}
              >
                <div className="flex items-center">
                  Product <SortIcon columnKey="productName" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("invIni")}
              >
                <div className="flex items-center justify-end">
                  Inv.Ini. <SortIcon columnKey="invIni" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("inputs")}
              >
                <div className="flex items-center justify-end">
                  Inputs <SortIcon columnKey="inputs" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("outputs")}
              >
                <div className="flex items-center justify-end">
                  Outputs <SortIcon columnKey="outputs" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("invEnd")}
              >
                <div className="flex items-center justify-end">
                  Inv.End. <SortIcon columnKey="invEnd" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((lot) => {
              const isSelected = selectedLot === lot.id;

              return (
                <tr
                  key={lot.id}
                  onClick={() => onSelectLot(isSelected ? null : lot.id)}
                  className={cn(
                    "cursor-pointer border-b transition-colors hover:bg-accent/50",
                    isSelected
                      ? "border-l-4 border-l-primary bg-accent"
                      : "border-l-4 border-l-transparent",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-[12px] text-foreground/80">
                      {lot.origen}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] font-bold text-primary">
                    {lot.lote}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-foreground/80">
                    {lot.documento}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-foreground">
                    {lot.productName}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-foreground/80">
                    {lot.invIni.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-foreground/80">
                    {lot.inputs.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-foreground/80">
                    {lot.outputs.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] font-bold text-foreground">
                    {lot.invEnd.toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {displayData.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No lots found for this product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-card p-2">
          <div className="px-2 text-[12px] text-muted-foreground">
            Page {page} of {totalPages} ({totalItems} lots)
          </div>
          <div className="flex gap-2 pr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || isFetching}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isFetching}
              className="h-7 w-7 p-0"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
