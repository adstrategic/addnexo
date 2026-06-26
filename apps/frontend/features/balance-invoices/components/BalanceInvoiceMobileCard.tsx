import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, FileText, User } from "lucide-react";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import type { Factura } from "../schemas/BalanceInvoicesResponseSchema";
import { BalanceInvoiceRowActions } from "./BalanceInvoiceRowActions";
import { BalanceInvoiceStatusBadge } from "./BalanceInvoiceStatusBadge";

interface BalanceInvoiceMobileCardProps {
  factura: Factura;
  onDelete?: (payload: { sequence: number; number: number }) => void;
}

export function BalanceInvoiceMobileCard({
  factura,
  onDelete,
}: BalanceInvoiceMobileCardProps) {
  const clientName = factura.cltemae?.CRazonSocial || "N/A";
  const vendorName = factura.vendedor?.VNombre;
  const isEditable = factura.movCXC?.length === 0;

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <FileText className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/balance-invoices/${factura.FGOrgSecuencia}`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Balance Invoice #{factura.FGNro}
              </Link>
              {factura.FGPurchaseOrder ? (
                <p className="text-xs text-muted-foreground">
                  PO {factura.FGPurchaseOrder}
                </p>
              ) : null}
            </div>

            <BalanceInvoiceRowActions
              factura={factura}
              isEditable={isEditable}
              onDelete={onDelete}
            />
          </div>

          <BalanceInvoiceStatusBadge status={factura.FGEstado} />

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
              {formatearFecha(factura.FGFechaCreado, { conTiempo: true })}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              Total {formatearMoneda(Number(factura.FGValorTotalBruto ?? 0))}
            </span>
            <span className="font-medium text-foreground">
              {formatearMoneda(Number(factura.FGSaldo ?? 0))}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
