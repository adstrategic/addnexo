"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { XCircle, AlertTriangle } from "lucide-react";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { useState } from "react";

interface DispatchOrderAnnulModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (razonAnulacion?: string) => Promise<void>;
  dispatchOrder: DispatchOrderResponse | null;
  isAnulling: boolean;
}

export function DispatchOrderAnnulModal({
  isOpen,
  onClose,
  onConfirm,
  dispatchOrder,
  isAnulling,
}: DispatchOrderAnnulModalProps) {
  const [razonAnulacion, setRazonAnulacion] = useState("");

  if (!dispatchOrder) return null;

  const handleConfirm = async () => {
    await onConfirm(razonAnulacion.trim() || undefined);
    setRazonAnulacion(""); // Reset on close
  };

  const handleClose = () => {
    setRazonAnulacion(""); // Reset on close
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Annul Dispatch Order</span>
          </DialogTitle>
          <div>
            Are you sure you want to annul dispatch order{" "}
            <strong>#{dispatchOrder.DOGNro}</strong>? This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Change the status to Annulled</li>
              <li>Restore inventory quantities (create entry movements)</li>
              <li>
                Use the same cost as the original exit (no average cost
                recalculation)
              </li>
            </ul>
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-yellow-800">
                This action cannot be undone. All inventory movements will be
                reversed.
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="razonAnulacion" className="text-sm font-medium">
            Reason for annulment (optional)
          </Label>
          <Textarea
            id="razonAnulacion"
            placeholder="Enter reason for annulling this dispatch order..."
            value={razonAnulacion}
            onChange={(e) => setRazonAnulacion(e.target.value)}
            disabled={isAnulling}
            rows={3}
            className="resize-none"
          />
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose} disabled={isAnulling}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isAnulling}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <XCircle className="h-4 w-4" />
            {isAnulling ? "Annulling..." : "Annul Dispatch Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
