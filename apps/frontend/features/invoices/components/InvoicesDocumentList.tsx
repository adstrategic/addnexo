"use client";

import { useState } from "react";
import { Download, FileText, Image, File, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Document } from "@/features/documents/types/documents-types";
import { DocumentViewerDialog } from "./DocumentViewerDialog";
import { useDocumentDownloadUrl } from "@/features/documents/hooks/useDocuments";
import { toast } from "sonner";

interface InvoicesDocumentListProps {
  documents: Document[];
}

export function InvoicesDocumentList({ documents }: InvoicesDocumentListProps) {
  const [documentToView, setDocumentToView] = useState<Document | null>(null);

  const downloadMutation = useDocumentDownloadUrl();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (mimeType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const handleDownload = async (documentId: number) => {
    try {
      const result = await downloadMutation.mutateAsync({
        documentId,
        download: true,
      });
      // Open download URL in new tab - it will trigger download due to Content-Disposition header
      window.open(result.url, "_blank");
      toast.success("Download started", {
        description: "The document has been downloaded successfully",
      });
    } catch (error) {
      toast.error("Error downloading document", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to download document",
      });
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <Card key={doc.DOCId}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.DOCMimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {doc.DOCOriginalFileName || doc.DOCFileName}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{formatFileSize(doc.DOCFileSize)}</span>
                      <span>Uploaded {formatDate(doc.DOCUploadedAt)}</span>
                      <span>By {doc.DOCUploadedBy}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDocumentToView(doc)}
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.DOCId)}
                    disabled={downloadMutation.isPending}
                    title="Download document"
                  >
                    {downloadMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DocumentViewerDialog
        document={documentToView}
        open={documentToView !== null}
        onOpenChange={(open) => !open && setDocumentToView(null)}
      />
    </>
  );
}
