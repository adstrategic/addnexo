"use client";

import { Button } from "@/components/ui/button";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  emptyMessage?: string;
  itemLabel?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  emptyMessage = "No items found",
  itemLabel = "items",
}: TablePaginationProps) {
  if (totalItems === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex flex-col gap-4 items-center justify-center py-4">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
        {totalItems > 0 && ` (${totalItems} ${itemLabel})`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => hasPrev && onPageChange(currentPage - 1)}
          disabled={!hasPrev}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => hasNext && onPageChange(currentPage + 1)}
          disabled={!hasNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
