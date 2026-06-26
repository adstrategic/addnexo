import { Building2, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupplierEmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
  onCreate?: () => void;
}

export function SupplierEmptyState({
  hasFilters,
  onClearFilters,
  onCreate,
}: SupplierEmptyStateProps) {
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
            No suppliers match your search
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different name, NIT, email, phone, or country filter.
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
        <Building2 className="size-6 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          No suppliers yet
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your first supplier to start managing purchases and inventory.
        </p>
      </div>
      {onCreate ? (
        <Button onClick={onCreate}>
          <Plus className="mr-2 size-4" aria-hidden />
          New Supplier
        </Button>
      ) : null}
    </div>
  );
}
