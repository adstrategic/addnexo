import { NotebookPen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreditNoteEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function CreditNoteEmptyState({
  hasFilters,
  onClearFilters,
}: CreditNoteEmptyStateProps) {
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
            No credit notes match your search
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different document number, client name, or invoice number.
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
        <NotebookPen className="size-6 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          No credit notes yet
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Credit notes registered against invoices will appear here.
        </p>
      </div>
    </div>
  );
}
