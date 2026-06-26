import { FileText, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BalanceInvoiceEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function BalanceInvoiceEmptyState({
  hasFilters,
  onClearFilters,
}: BalanceInvoiceEmptyStateProps) {
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
            No balance invoices match your search
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different invoice number, client name, or purchase order.
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
          No balance invoices in this view
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create a balance invoice to bill outstanding client balances.
        </p>
      </div>
      <Button asChild>
        <Link href="/balance-invoices/create">
          <Plus className="mr-2 size-4" aria-hidden />
          New Balance Invoice
        </Link>
      </Button>
    </div>
  );
}
