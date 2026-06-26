import { FileText, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function InvoiceEmptyState({
  hasFilters,
  onClearFilters,
}: InvoiceEmptyStateProps) {
  if (hasFilters) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
        role="status"
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-medium text-foreground">
            No invoices match your filters
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different search term, status tab, or date range.
          </p>
        </div>
        {onClearFilters ? (
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center"
      role="status"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
        <FileText className="size-6 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          No invoices in this view
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Invoices created from dispatch orders will appear here.
        </p>
      </div>
    </div>
  );
}
