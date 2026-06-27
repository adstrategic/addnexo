import { FolderOpen, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentType } from "../schemas/documents-response.schema";
import { getDocumentTypeLabel } from "../lib/utils";

interface DocumentEmptyStateProps {
  documentType: DocumentType;
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export function DocumentEmptyState({
  documentType,
  hasFilters,
  onClearFilters,
}: DocumentEmptyStateProps) {
  const typeLabel = getDocumentTypeLabel(documentType);

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
            No {typeLabel.toLowerCase()} documents match your search
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Try a different number, client name, or supplier name.
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
        <FolderOpen className="size-6 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-medium text-foreground">
          No uploaded files yet
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Uploaded files for {typeLabel.toLowerCase()}s will appear here once
          they are attached from the parent record.
        </p>
      </div>
    </div>
  );
}
