"use client";

import { CalendarIcon, Search, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerFilterSelector } from "@/features/movements/selectors/CustomerFilterSelector";
import { VendorFilterSelector } from "@/features/vendors/selectors/VendorFilterSelector";
import { cn } from "@/lib/utils";
import type { BillingFilterState } from "../schemas/BillingSchemas";

interface BillingFiltersBarProps {
  filters: BillingFilterState;
  onFilterChange: <K extends keyof BillingFilterState>(
    key: K,
    value: BillingFilterState[K],
  ) => void;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function BillingFiltersBar({
  filters,
  onFilterChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: BillingFiltersBarProps) {
  const rangeForCalendar: DateRange | undefined =
    dateRange?.from || dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : undefined;

  const hasDateRange = Boolean(dateRange?.from || dateRange?.to);

  return (
    <div className="flex flex-col gap-3 rounded-t-xl border border-b-0 bg-card p-4">
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
            aria-label="Search billing records"
            placeholder="Search by invoice, client, or notes..."
            className="h-10 w-full pr-10 pl-9"
            value={filters.search}
            onChange={(event) => onFilterChange("search", event.target.value)}
          />
          {filters.search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2 cursor-pointer"
              onClick={() => onFilterChange("search", "")}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange("status", value)}
          >
            <SelectTrigger className="h-10 w-full sm:w-[160px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <CustomerFilterSelector
            value={filters.clientId}
            onChange={(value) => onFilterChange("clientId", value)}
            placeholder="All clients"
          />

          <VendorFilterSelector
            value={filters.vendorId}
            onChange={(value) => onFilterChange("vendorId", value)}
            placeholder="All vendors"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 min-w-[140px] cursor-pointer justify-start text-left font-normal",
                  !hasDateRange && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 size-4" aria-hidden />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {dateRange.from.toLocaleDateString()} –{" "}
                      {dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    dateRange.from.toLocaleDateString()
                  )
                ) : (
                  <span>Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={rangeForCalendar}
                onSelect={(range) =>
                  onDateRangeChange(range?.from, range?.to)
                }
                numberOfMonths={2}
              />
              {hasDateRange ? (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full cursor-pointer"
                    onClick={() => onDateRangeChange(undefined, undefined)}
                  >
                    Clear dates
                  </Button>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>

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
