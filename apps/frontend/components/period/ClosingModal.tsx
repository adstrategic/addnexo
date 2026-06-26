"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import {
  periodApi,
  type PeriodWithLabel,
  type ZeroCostEntry,
} from "@/lib/api/period";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ClosingModalProps = {
  period: PeriodWithLabel;
  open: boolean;
  onClosed: () => void;
};

type Step = "idle" | "validating" | "invalid" | "closing" | "done";

export function ClosingModal({ period, open, onClosed }: ClosingModalProps) {
  const { data: activeMember } = authClient.useActiveMember();
  const isAdmin = activeMember?.role === "admin";

  const [step, setStep] = useState<Step>("idle");
  const [entries, setEntries] = useState<ZeroCostEntry[]>([]);
  const [message, setMessage] = useState<string>("");

  const reset = useCallback(() => {
    setStep("idle");
    setEntries([]);
    setMessage("");
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleValidateAndClose = async () => {
    setStep("validating");
    setEntries([]);
    setMessage("");

    try {
      const validation = await periodApi.validateClose(period.mes, period.ano);
      if (!validation.valid) {
        setEntries(validation.entries);
        setMessage(validation.message);
        setStep("invalid");
        return;
      }

      setStep("closing");
      await periodApi.close(period.mes, period.ano);
      setStep("done");
      onClosed();
    } catch {
      setStep("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Period closing required</DialogTitle>
          <DialogDescription>
            {period.label} needs to be closed before you can continue working in
            inventory.
          </DialogDescription>
        </DialogHeader>

        {step === "invalid" && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{message}</p>
            <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3 text-sm">
              {entries.map((entry) => (
                <li key={entry.movimientoId}>
                  #{entry.secuencial} — {entry.producto} ({entry.fecha}) — qty{" "}
                  {entry.cantidad}
                  {entry.esCostoTemporalCero ? " (temporary zero cost)" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(step === "validating" || step === "closing") && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {step === "validating"
              ? "Validating period..."
              : "Closing period..."}
          </div>
        )}

        <DialogFooter>
          {!isAdmin ? (
            <p className="text-sm text-muted-foreground">
              Contact your administrator to close this period.
            </p>
          ) : step === "invalid" ? (
            <Button type="button" variant="outline" onClick={reset}>
              Try again
            </Button>
          ) : (
            <Button
              type="button"
              disabled={step === "validating" || step === "closing"}
              onClick={() => void handleValidateAndClose()}
            >
              Close {period.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
