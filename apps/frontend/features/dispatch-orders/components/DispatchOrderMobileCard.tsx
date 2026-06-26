import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, ClipboardList, User } from "lucide-react";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { DispatchOrderRowActions } from "./DispatchOrderRowActions";
import { DispatchOrderStatusBadge } from "./DispatchOrderStatusBadge";

interface DispatchOrderMobileCardProps {
  dispatchOrder: DispatchOrderResponse;
  canViewPrices: boolean;
  onDelete?: (payload: { sequence: number; number: number }) => void;
  onDispatch: (sequence: number) => void;
  onReturn: (dispatchOrder: DispatchOrderResponse) => void;
  onConvertToInvoice: (dispatchOrder: DispatchOrderResponse) => void;
  onAnnul: (dispatchOrder: DispatchOrderResponse) => void;
  onRegeneratePdf: (sequence: number) => void;
  isRegeneratingPdf?: boolean;
}

export function DispatchOrderMobileCard({
  dispatchOrder,
  canViewPrices,
  onDelete,
  onDispatch,
  onReturn,
  onConvertToInvoice,
  onAnnul,
  onRegeneratePdf,
  isRegeneratingPdf,
}: DispatchOrderMobileCardProps) {
  const clientName = dispatchOrder.cltemae?.CRazonSocial || "N/A";
  const vendorName = dispatchOrder.vendedor?.VNombre;

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <ClipboardList className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/dispatch-orders/${dispatchOrder.DOGOrgSecuencia}`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Dispatch Order #{dispatchOrder.DOGNro}
              </Link>
              {dispatchOrder.DOGPurchaseOrder ? (
                <p className="text-xs text-muted-foreground">
                  PO {dispatchOrder.DOGPurchaseOrder}
                </p>
              ) : null}
            </div>

            <DispatchOrderRowActions
              dispatchOrder={dispatchOrder}
              onDelete={onDelete}
              onDispatch={onDispatch}
              onReturn={onReturn}
              onConvertToInvoice={onConvertToInvoice}
              onAnnul={onAnnul}
              onRegeneratePdf={onRegeneratePdf}
              isRegeneratingPdf={isRegeneratingPdf}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DispatchOrderStatusBadge status={dispatchOrder.DOGEstado} />
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">{clientName}</span>
            </span>
            {vendorName ? (
              <span className="inline-flex items-center gap-1">
                <User className="size-3.5 shrink-0" aria-hidden />
                {vendorName}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              {formatearFecha(dispatchOrder.DOGFechaCreado, { conTiempo: true })}
            </span>
          </div>

          {canViewPrices ? (
            <p className="text-sm font-medium text-foreground">
              {formatearMoneda(Number(dispatchOrder.DOGValorTotalNeto ?? 0))}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
