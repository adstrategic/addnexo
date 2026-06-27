import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, NotebookPen } from "lucide-react";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import { InvoiceStatusBadge } from "@/features/invoices/components/InvoiceStatusBadge";
import type { CreditNoteResponse } from "../schemas/credit-note-response.schema";
import { CreditNoteRowActions } from "./CreditNoteRowActions";

interface CreditNoteMobileCardProps {
  note: CreditNoteResponse;
}

export function CreditNoteMobileCard({ note }: CreditNoteMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <NotebookPen className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/credit-notes/${note.MCSecuencia}`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {note.MCNroDocumento}
              </Link>
              <p className="text-xs text-muted-foreground">
                Invoice{" "}
                <Link
                  href={`/invoices/${note.facturag.FGOrgSecuencia}`}
                  className="text-primary hover:underline"
                >
                  #{note.facturag.FGNro}
                </Link>
              </p>
            </div>
            <CreditNoteRowActions note={note} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <InvoiceStatusBadge status={note.facturag.FGEstado} />
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">
                {note.facturag.cltemae.CRazonSocial}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              {note.MCFecha
                ? formatearFecha(note.MCFecha, { conTiempo: false })
                : "—"}
            </span>
          </div>

          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {formatearMoneda(Number(note.MCValor))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
