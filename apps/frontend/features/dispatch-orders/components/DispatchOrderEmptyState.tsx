import { ClipboardList, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DispatchOrderEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function DispatchOrderEmptyState({
  hasFilters,
  onClearFilters,
}: DispatchOrderEmptyStateProps) {
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
            No dispatch orders match your search
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different order number, client name, or purchase order.
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
        <ClipboardList className="size-6 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          No dispatch orders yet
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Create your first dispatch order to start managing outbound shipments.
        </p>
      </div>
      <Button asChild>
        <Link href="/dispatch-orders/create">
          <Plus className="mr-2 size-4" aria-hidden />
          New Dispatch Order
        </Link>
      </Button>
    </div>
  );
}
