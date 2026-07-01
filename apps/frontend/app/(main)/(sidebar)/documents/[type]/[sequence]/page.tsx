"use client";

import { use, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDocumentsForDocument,
  useDeleteDocument,
  useDocumentDownloadUrl,
} from "@/features/documents/hooks/useDocuments";
import { Download, Trash2, ArrowLeft, File, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Document,
  DocumentType,
} from "@/features/documents/types/documents-types";

interface DocumentDetailPageProps {
  params: Promise<{
    type: string;
    sequence: string;
  }>;
}

export default function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const type = resolvedParams.type as DocumentType;
  const sequence = parseInt(resolvedParams.sequence);

  const { data, isLoading, error } = useDocumentsForDocument(
    type,
    sequence,
    true
  );

  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDocumentDownloadUrl();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDownload = async (documentId: number) => {
    try {
      const result = await downloadDocument.mutateAsync({
        documentId,
        download: true,
      });
      // Open download URL in new tab - it will trigger download due to Content-Disposition header
      window.open(result.url, "_blank");
      toast.success("Download started");
    } catch (error: any) {
      toast.error(error.message || "Failed to download document");
    }
  };

  const handlePreview = async (doc: Document) => {
    try {
      const result = await downloadDocument.mutateAsync({
        documentId: doc.DOCId,
        download: false,
      });
      setPreviewUrl(result.url);
      setPreviewDoc(doc);
      setIsPreviewOpen(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to load document preview");
    }
  };

  const handleDelete = async (documentId: number, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await deleteDocument.mutateAsync(documentId);
      toast.success("Document deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  const getDocumentTypeLabel = (docType: DocumentType) => {
    switch (docType) {
      case "dispatch-order":
        return "Dispatch Order";
      case "purchase-order":
        return "Purchase Order";
      case "invoice":
        return "Invoice";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive">Error loading documents</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {getDocumentTypeLabel(type)} #{sequence} - Documents
            </h1>
            <p className="text-sm text-muted-foreground">
              View and manage documents for this {type.replace("-", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data?.documents || data.documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found for this {type.replace("-", " ")}
            </div>
          ) : (
            <div className="space-y-4">
              {data.documents.map((doc) => (
                <div
                  key={doc.DOCId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <File className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{doc.DOCFileName}</p>
                      <p className="text-sm text-muted-foreground">
                        Original: {doc.DOCOriginalFileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.DOCFileSize)} • Uploaded{" "}
                        {formatDate(doc.DOCUploadedAt)} by {doc.DOCUploadedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.DOCId)}
                      disabled={downloadDocument.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                      disabled={downloadDocument.isPending}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.DOCFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0 bg-muted/20 rounded-md overflow-hidden">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-none"
                title="Document Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
