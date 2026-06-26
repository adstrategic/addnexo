"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DispatchOrderDocumentUpload } from "./DispatchOrderDocumentUpload";
import { useDispatchOrderWithFiles } from "../hooks/useDispatchOrderDocuments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DispatchOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispatchOrderSequence: number;
  onSuccess?: () => void;
}

export function DispatchOrderDialog({
  open,
  onOpenChange,
  dispatchOrderSequence,
  onSuccess,
}: DispatchOrderDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const dispatchMutation = useDispatchOrderWithFiles();

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Documents required", {
        description:
          "Please upload at least one document to dispatch the order",
      });
      return;
    }

    try {
      await dispatchMutation.mutateAsync({
        sequence: dispatchOrderSequence,
        files,
      });

      toast.success("Dispatch order dispatched successfully", {
        description:
          "The order has been marked as dispatched with uploaded documents",
      });

      setFiles([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error("Failed to dispatch order", {
        description: error.message || "Failed to dispatch order",
      });
    }
  };

  const handleCancel = () => {
    setFiles([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dispatch Order</DialogTitle>
          <DialogDescription>
            Upload signed documents to mark this order as dispatched. At least
            one document is required.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <DispatchOrderDocumentUpload
            files={files}
            onFilesChange={setFiles}
            disabled={dispatchMutation.isPending}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={dispatchMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={dispatchMutation.isPending || files.length === 0}
          >
            {dispatchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispatching...
              </>
            ) : (
              "Dispatch Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
