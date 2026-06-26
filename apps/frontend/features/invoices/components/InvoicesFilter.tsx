"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface InvoicesFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange?: { from?: Date; to?: Date };
  onDateRangeChange: (from: Date | undefined, to: Date | undefined) => void;
}

export function InvoicesFilter({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}: InvoicesFilterProps) {
  const rangeForCalendar: DateRange | undefined =
    dateRange?.from || dateRange?.to
      ? { from: dateRange.from, to: dateRange.to }
      : undefined;

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range?.from, range?.to);
  };

  const hasDateRange = dateRange?.from || dateRange?.to;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by invoice number, client, PO, status..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Date range picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[140px] justify-start text-left font-normal",
              !hasDateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {dateRange.from.toLocaleDateString()} -{" "}
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
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
          />
          {hasDateRange && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => onDateRangeChange(undefined, undefined)}
              >
                Clear dates
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
