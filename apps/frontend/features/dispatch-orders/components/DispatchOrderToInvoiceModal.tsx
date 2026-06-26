"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2 } from "lucide-react";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import type { TipoPago } from "../schemas/dispatch-order-to-invoice.schema";

interface DispatchOrderToInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (diasParaVencimiento: number, pago: TipoPago) => Promise<void>;
  dispatchOrder: DispatchOrderResponse | null;
  isCreating: boolean;
}

export function DispatchOrderToInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
  dispatchOrder,
  isCreating,
}: DispatchOrderToInvoiceModalProps) {
  const defaultDays = dispatchOrder?.cltemae?.CDiasParaVencerFactura ?? 30;
  const [diasParaVencimiento, setDiasParaVencimiento] = useState<
    number | string
  >(defaultDays);
  const [pago, setPago] = useState<TipoPago>("CONTADO");
  const [error, setError] = useState<string>("");

  // Reset to default when modal opens or dispatch order changes
  useEffect(() => {
    if (isOpen && dispatchOrder) {
      const defaultDays = dispatchOrder.cltemae?.CDiasParaVencerFactura ?? 30;
      setDiasParaVencimiento(defaultDays);
      setPago("CONTADO");
      setError("");
    }
  }, [isOpen, dispatchOrder]);

  const validateInput = (value: number | string): string => {
    if (value === "" || value === null || value === undefined) {
      return "Days to due date is required";
    }
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    if (isNaN(numValue)) {
      return "Please enter a valid number";
    }
    if (numValue < 1) {
      return "Days must be 1 or greater";
    }
    if (numValue > 365) {
      return "Days cannot exceed 365";
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiasParaVencimiento(value);

    // Clear error if input is being cleared (user is typing)
    if (value === "") {
      setError("");
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      const validationError = validateInput(numValue);
      setError(validationError);
    } else if (value !== "") {
      setError("Please enter a valid number");
    }
  };

  const handleConfirm = async () => {
    // Validate the input before submitting
    const numValue =
      typeof diasParaVencimiento === "string"
        ? parseInt(diasParaVencimiento, 10)
        : diasParaVencimiento;

    const validationError = validateInput(numValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Clear any previous errors
    setError("");
    await onConfirm(numValue, pago);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Convert to Invoice</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to convert Dispatch Order{" "}
            <strong>#{dispatchOrder?.DOGNro}</strong> to an invoice? This action
            will create a new invoice based on the dispatch order details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pago">Payment Type *</Label>
            <Select
              value={pago}
              onValueChange={(value) => setPago(value as TipoPago)}
              disabled={isCreating}
            >
              <SelectTrigger id="pago">
                <SelectValue placeholder="Select payment type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONTADO">Cash</SelectItem>
                <SelectItem value="CANJE">Exchange</SelectItem>
                <SelectItem value="CREDITO">Credit</SelectItem>
                <SelectItem value="WALLET">Digital Wallet</SelectItem>
                <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Payment type for the invoice
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="diasParaVencimiento">Days to Due Date *</Label>
            <Input
              id="diasParaVencimiento"
              type="number"
              min={1}
              max={365}
              step={1}
              value={diasParaVencimiento}
              onChange={handleInputChange}
              onBlur={() => {
                // Validate on blur to show error if user leaves field empty
                const numValue =
                  typeof diasParaVencimiento === "string"
                    ? parseInt(diasParaVencimiento, 10)
                    : diasParaVencimiento;
                const validationError = validateInput(numValue);
                setError(validationError);
              }}
              disabled={isCreating}
              placeholder="Enter days"
              className={error ? "border-red-500" : ""}
              required
            />
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Number of days until the invoice due date (1-365)
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isCreating || !!error || diasParaVencimiento === ""}
            className="flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                <span>Confirm</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
