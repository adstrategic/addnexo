import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Calendar, FileStack } from "lucide-react";
import { formatearFecha } from "@/lib/utils";
import type { DocumentType, ParentDocument } from "../schemas/documents-response.schema";
import { getDocumentTypeLabel } from "../lib/utils";
import { DocumentRowActions } from "./DocumentRowActions";

interface DocumentMobileCardProps {
  document: ParentDocument;
  documentType: DocumentType;
}

export function DocumentMobileCard({
  document,
  documentType,
}: DocumentMobileCardProps) {
  const entityName =
    documentType === "purchase-order"
      ? document.supplierName
      : document.clientName;
  const typeLabel = getDocumentTypeLabel(documentType);

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <FileStack className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <Link
                href={`/documents/${documentType}/${document.sequence}`}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                {typeLabel} #{document.number}
              </Link>
            </div>

            <DocumentRowActions
              documentType={documentType}
              sequence={document.sequence}
              number={document.number}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {document.documentCount}{" "}
              {document.documentCount === 1 ? "file" : "files"}
            </Badge>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-1">{entityName || "—"}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5 shrink-0" aria-hidden />
              {formatearFecha(document.date, { conTiempo: false })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
