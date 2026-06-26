"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Folder } from "lucide-react";
import { TablePagination } from "@/components/shared/TablePagination";
import type { DocumentType } from "../types/documents-types";

interface DocumentRow {
  sequence: number;
  number: number;
  clientName?: string;
  supplierName?: string;
  date: string;
  documentCount: number;
}

interface DocumentsTableProps {
  documents: DocumentRow[];
  isLoading: boolean;
  documentType: DocumentType;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const DocumentsTable = ({
  documents,
  isLoading,
  documentType,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: DocumentsTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No documents found
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    switch (type) {
      case "dispatch-order":
        return "Dispatch Order";
      case "purchase-order":
        return "Purchase Order";
      case "invoice":
        return "Invoice";
    }
  };

  return (
    <div className="py-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>
                {documentType === "purchase-order" ? "Supplier" : "Client"}
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const documentName = `${getDocumentTypeLabel(documentType)} #${doc.number}`;
              const entityName =
                documentType === "purchase-order"
                  ? doc.supplierName
                  : doc.clientName;

              return (
                <TableRow key={`${documentType}-${doc.sequence}`}>
                  <TableCell className="font-medium">
                    {documentName}
                  </TableCell>
                  <TableCell>{entityName || "N/A"}</TableCell>
                  <TableCell>{formatDate(doc.date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.documentCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/documents/${documentType}/${doc.sequence}`}
                      className="inline-flex items-center justify-center"
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Folder className="h-4 w-4" />
                        <span className="sr-only">View documents</span>
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
        emptyMessage="No documents found"
        itemLabel="documents"
      />
    </div>
  );
};


























