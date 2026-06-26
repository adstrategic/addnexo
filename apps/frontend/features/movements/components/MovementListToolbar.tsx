"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { ProductFilterSelector } from "../selectors/ProductFilterSelector";
import { SupplierFilterSelector } from "../selectors/SupplierFilterSelector";
import { CustomerFilterSelector } from "../selectors/CustomerFilterSelector";

interface MovementListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  productId?: number;
  onProductChange: (value: number | undefined) => void;
  supplierId?: number;
  onSupplierChange: (value: number | undefined) => void;
  customerId?: number;
  onCustomerChange: (value: number | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function MovementListToolbar({
  searchTerm,
  onSearchChange,
  productId,
  onProductChange,
  supplierId,
  onSupplierChange,
  customerId,
  onCustomerChange,
  onClearFilters,
  hasActiveFilters,
}: MovementListToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            inputMode="search"
            autoComplete="off"
            role="searchbox"
            aria-label="Search movements"
            placeholder="Search by product, supplier, or customer..."
            className="h-10 w-full pr-10 pl-9"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchTerm ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2 cursor-pointer"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <ProductFilterSelector
            value={productId}
            onChange={onProductChange}
            placeholder="All products"
          />
          <SupplierFilterSelector
            value={supplierId}
            onChange={onSupplierChange}
            placeholder="All suppliers"
          />
          <CustomerFilterSelector
            value={customerId}
            onChange={onCustomerChange}
            placeholder="All customers"
          />

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
