"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  KardexProduct,
  KardexProductTotals,
  KardexTableServerPagination,
} from "../schemas/KardexSchemas";

interface ProductSummaryTableProps {
  products: KardexProduct[];
  totals: KardexProductTotals;
  selectedProduct: string | null;
  onSelectProduct: (id: string | null, invcaruniId?: number | null) => void;
  serverPagination: KardexTableServerPagination;
  isFetching?: boolean;
}

type SortKey =
  | "name"
  | "country"
  | "invIni"
  | "inputs"
  | "outputs"
  | "invEnd"
  | "stockValue"
  | "totalValueLastCost";

const usd = (value: number) =>
  `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const OUTPUTS_USD_COLOR = "text-blue-600";

export function ProductSummaryTable({
  products,
  totals,
  selectedProduct,
  onSelectProduct,
  serverPagination,
  isFetching = false,
}: ProductSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const { page, totalPages, totalItems, onPageChange } = serverPagination;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const displayData = useMemo(() => {
    return [...products].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [products, sortKey, sortAsc]);

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
    "py-3 px-4 font-semibold text-foreground text-[11px] uppercase tracking-wider cursor-pointer hover:bg-accent/50";

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="relative overflow-x-auto">
        {isFetching && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-card/60">
            <p className="text-xs font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        )}
        <table className="w-full min-w-[1200px] border-collapse text-left">
          <thead className="sticky top-0 z-10 border-b-2 bg-muted">
            <tr>
              <th className="w-[40px] px-4 py-3 text-[12px] font-medium text-muted-foreground">
                #
              </th>
              <th className={headerCls} onClick={() => handleSort("name")}>
                <div className="flex items-center">
                  Product <SortIcon columnKey="name" />
                </div>
              </th>
              <th className={headerCls} onClick={() => handleSort("country")}>
                <div className="flex items-center">
                  Origin <SortIcon columnKey="country" />
                </div>
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("invIni")}
              >
                <div className="flex items-center justify-end">
                  Inv.Ini <SortIcon columnKey="invIni" />
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
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-primary">
                $Inputs
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
                className={cn(
                  "px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider",
                  OUTPUTS_USD_COLOR,
                )}
              >
                $Outputs
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("invEnd")}
              >
                <div className="flex items-center justify-end">
                  Inv.End <SortIcon columnKey="invEnd" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Avg Cost
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("stockValue")}
              >
                <div className="flex items-center justify-end">
                  Stock Value <SortIcon columnKey="stockValue" />
                </div>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-foreground">
                Last Cost
              </th>
              <th
                className={cn(headerCls, "text-right")}
                onClick={() => handleSort("totalValueLastCost")}
              >
                <div className="flex items-center justify-end">
                  Stock Value (Last) <SortIcon columnKey="totalValueLastCost" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((p, idx) => {
              const isSelected = selectedProduct === p.id;
              const isLowStock = p.invEnd < p.minStock;
              return (
                <tr
                  key={p.id}
                  onClick={() =>
                    onSelectProduct(
                      isSelected ? null : p.id,
                      isSelected ? null : p.invcaruniId,
                    )
                  }
                  className={cn(
                    "group cursor-pointer border-b transition-colors hover:bg-accent/50",
                    isSelected
                      ? "border-l-4 border-l-primary bg-accent"
                      : "border-l-4 border-l-transparent",
                  )}
                >
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    {(page - 1) * 10 + idx + 1}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-medium text-foreground">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {p.code} • {p.group}
                        </span>
                      </div>
                      {isSelected && (
                        <div
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectProduct(null);
                          }}
                        >
                          <X size={14} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-foreground/80">
                    {p.country || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-foreground/80">
                    {p.invIni.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-foreground/80">
                    {p.inputs.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-primary">
                    {usd(p.inputsUSD)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-foreground/80">
                    {p.outputs.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono text-[12px]",
                      OUTPUTS_USD_COLOR,
                    )}
                  >
                    {usd(p.outputsUSD)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isLowStock && (
                        <span className="rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-destructive-foreground">
                          LOW
                        </span>
                      )}
                      <span
                        className={cn(
                          "font-mono text-[12px]",
                          isLowStock
                            ? "font-bold text-destructive"
                            : "text-foreground/80",
                        )}
                      >
                        {p.invEnd.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-foreground/80">
                    {usd(p.avgCost ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] font-bold text-foreground">
                    {usd(p.stockValue)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-foreground/80">
                    {usd(p.lastCost ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] font-bold text-foreground">
                    {usd(p.totalValueLastCost ?? 0)}
                  </td>
                </tr>
              );
            })}

            <tr className="border-t-2 bg-secondary font-bold">
              <td
                colSpan={2}
                className="px-4 py-3 text-right text-[12px] uppercase tracking-wider text-secondary-foreground"
              >
                Total
              </td>
              <td className="px-4 py-3 text-[12px] text-muted-foreground">—</td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-secondary-foreground">
                {totals.invIni.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-secondary-foreground">
                {totals.inputs.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-primary">
                {usd(totals.inputsUSD)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-secondary-foreground">
                {totals.outputs.toLocaleString()}
              </td>
              <td
                className={cn(
                  "px-4 py-3 text-right font-mono text-[12px]",
                  OUTPUTS_USD_COLOR,
                )}
              >
                {usd(totals.outputsUSD)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-secondary-foreground">
                {totals.invEnd.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-muted-foreground">
                —
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-secondary-foreground">
                {usd(totals.stockValue)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-muted-foreground">
                —
              </td>
              <td className="px-4 py-3 text-right font-mono text-[12px] text-secondary-foreground">
                {usd(totals.totalValueLastCost)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t bg-card p-3">
          <div className="px-2 text-[12px] text-muted-foreground">
            Page {page} of {totalPages} ({totalItems} products)
          </div>
          <div className="flex gap-2 pr-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || isFetching}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || isFetching}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
