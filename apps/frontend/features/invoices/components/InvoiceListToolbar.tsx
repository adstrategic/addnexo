"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface InvoiceListToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function InvoiceListToolbar({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
  hasActiveFilters,
}: InvoiceListToolbarProps) {
  const rangeForCalendar: DateRange | undefined =
    dateRange?.from || dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : undefined;

  const hasDateRange = Boolean(dateRange?.from || dateRange?.to);

  return (
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
          aria-label="Search invoices"
          placeholder="Search by invoice number, client, PO, or status..."
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
  );
}
