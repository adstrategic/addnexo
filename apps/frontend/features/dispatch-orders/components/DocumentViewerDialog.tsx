"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileText, Image } from "lucide-react";
import type { DispatchOrderDocument } from "../service/dispatch-order-documents.service";
import { useDocumentDownloadUrl } from "../hooks/useDispatchOrderDocuments";

interface DocumentViewerDialogProps {
  document: DispatchOrderDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentViewerDialog({
  document,
  open,
  onOpenChange,
}: DocumentViewerDialogProps) {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const downloadMutation = useDocumentDownloadUrl();

  const isImage = document?.DOCMimeType?.startsWith("image/") ?? false;
  const isPdf = document?.DOCMimeType === "application/pdf";

  useEffect(() => {
    if (open && document) {
      // Reset URL when dialog opens
      setDocumentUrl(null);

      // Fetch the signed URL (download: false for viewing)
      downloadMutation.mutate(
        { documentId: document.DOCId, download: false },
        {
          onSuccess: (result) => {
            setDocumentUrl(result.url);
          },
          onError: () => {
            setDocumentUrl(null);
          },
        }
      );
    } else if (!open) {
      // Clear URL when dialog closes
      setDocumentUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, document?.DOCId]);

  const isLoading = downloadMutation.isPending || !documentUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {isImage && <Image className="h-5 w-5 text-blue-500" />}
            {isPdf && <FileText className="h-5 w-5 text-red-500" />}
            {document?.DOCOriginalFileName ||
              document?.DOCFileName ||
              "View Document"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 w-full h-full min-h-0 bg-muted/20 rounded-md overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading document...
                </p>
              </div>
            </div>
          ) : documentUrl ? (
            <iframe
              src={documentUrl}
              className="w-full h-full border-none"
              title="Document Preview"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Failed to load document
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
