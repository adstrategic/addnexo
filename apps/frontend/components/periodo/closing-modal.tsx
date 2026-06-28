"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { periodoApi, type PeriodoStatus, type ValidacionPreCierre } from "@/lib/api/periodo";

const MES_NOMBRES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function periodoLabel(mes: number, ano: number) {
  return `${MES_NOMBRES[mes - 1]} ${2000 + ano}`;
}

type Step = "idle" | "validating" | "invalid-entries" | "closing" | "done";

interface ClosingModalProps {
  status: PeriodoStatus;
  onClosed: () => void;
  /** When false the close action is hidden and a contact-admin message is shown instead. */
  isAdmin?: boolean;
  /** Called when the user dismisses the modal to register movements first. */
  onDismiss?: () => void;
}

export function ClosingModal({ status, onClosed, isAdmin = true, onDismiss }: ClosingModalProps) {
  const periodo = status.periodoACerrar!;
  const [step, setStep] = useState<Step>("idle");
  const [validacion, setValidacion] = useState<ValidacionPreCierre | null>(null);

  const handleCerrar = async () => {
    setStep("validating");
    try {
      const { data: val } = await periodoApi.validarCierre(periodo.mes, periodo.ano);
      if (!val.valido) {
        setValidacion(val);
        setStep("invalid-entries");
        return;
      }
    } catch (error: any) {
      toast.error(error.message || "Error al validar el período");
      setStep("idle");
      return;
    }

    setStep("closing");
    try {
      const { message } = await periodoApi.cerrarMes(periodo.mes, periodo.ano);
      toast.success(message || `Período ${periodoLabel(periodo.mes, periodo.ano)} cerrado exitosamente`);
      setStep("done");
      onClosed();
    } catch (error: any) {
      const msg: string = error.message || "Error al cerrar el período";
      if (msg.includes("costo cero") || msg.includes("zero")) {
        toast.error("Hay entradas con costo cero en el período. Actualice los costos antes de cerrar.");
      } else {
        toast.error(msg);
      }
      setStep("idle");
    }
  };

  const isLoading = step === "validating" || step === "closing";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="text-amber-500 shrink-0" size={24} />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Month-End Close Required</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            The period{" "}
            <strong>{periodoLabel(periodo.mes, periodo.ano)}</strong> needs to be
            closed before continuing.
          </p>
        </div>
      </div>

      {step === "invalid-entries" && validacion && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800 mb-2">
            Zero-cost entries detected ({validacion.entradas.length}):
          </p>
          <ul className="text-xs text-red-700 space-y-1 max-h-36 overflow-y-auto">
            {validacion.entradas.map((e) => (
              <li key={e.MVId} className="flex justify-between gap-2">
                <span>{e.invcaruni.CKDescripcion}</span>
                <span className="text-gray-500">Doc: {e.MVNroDocumento}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-red-700 mt-2">
            Update the costs for these entries before closing the month.
          </p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
        <p>Closing the month will create the opening balances for the next period.</p>
        <p className="mt-1 text-xs text-gray-400">
          This operation cannot be undone. Make sure all movements for the period
          are correctly registered before closing.
        </p>
      </div>

      {isAdmin ? (
        <>
          <Button
            onClick={handleCerrar}
            disabled={isLoading || step === "done" || step === "invalid-entries"}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {step === "validating" ? "Validating..." : "Closing period..."}
              </>
            ) : step === "done" ? (
              <>
                <CheckCircle2 size={16} className="mr-2" />
                Closed successfully
              </>
            ) : (
              `Close ${periodoLabel(periodo.mes, periodo.ano)}`
            )}
          </Button>

          {step === "invalid-entries" && (
            <Button variant="outline" onClick={() => setStep("idle")} className="w-full">
              Go back
            </Button>
          )}

          {onDismiss && step !== "done" && (
            <Button
              variant="ghost"
              onClick={onDismiss}
              disabled={isLoading}
              className="w-full text-gray-500"
            >
              Register movements first
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-center text-gray-500 py-2">
            Contact your administrator to close the{" "}
            <strong>{periodoLabel(periodo.mes, periodo.ano)}</strong> period.
          </p>
          {onDismiss && (
            <Button
              variant="ghost"
              onClick={onDismiss}
              className="w-full text-gray-500"
            >
              Dismiss
            </Button>
          )}
        </>
      )}
    </div>
  );
}
