import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EstadoInvoice } from "../schemas/invoices-response.schema";

const STATUS_LABELS: Record<EstadoInvoice, string> = {
  [EstadoInvoice.ACTIVE]: "Active",
  [EstadoInvoice.PAID]: "Paid",
  [EstadoInvoice.OVERDUE]: "Overdue",
  [EstadoInvoice.ANULATED]: "Anulated",
};

const STATUS_STYLES: Record<
  EstadoInvoice,
  {
    className: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  [EstadoInvoice.ACTIVE]: {
    variant: "outline",
    className:
      "border-amber-500/50 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300",
  },
  [EstadoInvoice.PAID]: {
    variant: "secondary",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  [EstadoInvoice.OVERDUE]: {
    variant: "destructive",
    className:
      "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  },
  [EstadoInvoice.ANULATED]: {
    variant: "secondary",
    className: "bg-muted text-muted-foreground line-through",
  },
};

interface InvoiceStatusBadgeProps {
  status: EstadoInvoice;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <Badge
      variant={style.variant}
      className={cn("font-medium", style.className, className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
