"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatearFecha, getPageNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { DocumentType, ParentDocument } from "../schemas/documents-response.schema";
import {
  getDocumentEntityLabel,
  getDocumentTypeLabel,
} from "../lib/utils";
import { DocumentEmptyState } from "./DocumentEmptyState";
import { DocumentMobileCard } from "./DocumentMobileCard";
import { DocumentRowActions } from "./DocumentRowActions";
import { DocumentTableSkeleton } from "./DocumentTableSkeleton";
import { documentListPadding } from "./layout/document-list-layout";

interface DocumentsTableProps {
  documents: ParentDocument[];
  isLoading: boolean;
  isFetching?: boolean;
  documentType: DocumentType;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function DocumentPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  DocumentsTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        documentListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "record" : "records"}
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={cn(
                "cursor-pointer",
                (currentPage <= 1 || totalPages <= 1) &&
                  "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>

          {getPageNumbers(totalPages, currentPage).map((page, index) => (
            <PaginationItem key={index} className="hidden sm:list-item">
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={cn(
                "cursor-pointer",
                (currentPage >= totalPages || totalPages <= 1) &&
                  "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function DocumentsTable({
  documents,
  isLoading,
  isFetching = false,
  documentType,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
}: DocumentsTableProps) {
  if (isLoading) {
    return <DocumentTableSkeleton />;
  }

  if (documents.length === 0) {
    return (
      <DocumentEmptyState
        documentType={documentType}
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  const typeLabel = getDocumentTypeLabel(documentType);
  const entityLabel = getDocumentEntityLabel(documentType);

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", documentListPadding.x)}>
        {documents.map((document) => (
          <DocumentMobileCard
            key={`${documentType}-${document.sequence}`}
            document={document}
            documentType={documentType}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", documentListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Document</TableHead>
                <TableHead>{entityLabel}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Files</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const entityName =
                  documentType === "purchase-order"
                    ? document.supplierName
                    : document.clientName;

                return (
                  <TableRow
                    key={`${documentType}-${document.sequence}`}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-0 font-medium">
                      <Link
                        href={`/documents/${documentType}/${document.sequence}`}
                        className="text-primary transition-colors hover:text-primary/80"
                      >
                        {typeLabel} #{document.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2">{entityName || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {formatearFecha(document.date, { conTiempo: false })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.documentCount}</Badge>
                    </TableCell>
                    <TableCell className="pr-0">
                      <DocumentRowActions
                        documentType={documentType}
                        sequence={document.sequence}
                        number={document.number}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <DocumentPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
