import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  EstadoFactura,
  type EstadoFacturaValue,
} from "../schemas/BalanceInvoicesResponseSchema";

const STATUS_LABELS: Record<EstadoFacturaValue, string> = {
  [EstadoFactura.DRAFT]: "Draft",
  [EstadoFactura.ACTIVE]: "Active",
  [EstadoFactura.PAID]: "Paid",
  [EstadoFactura.OVERDUE]: "Overdue",
  [EstadoFactura.ANULATED]: "Anulated",
};

const STATUS_STYLES: Record<
  EstadoFacturaValue,
  {
    className: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  [EstadoFactura.DRAFT]: {
    variant: "outline",
    className:
      "border-slate-400/50 bg-slate-50 text-slate-700 dark:border-slate-500/40 dark:bg-slate-950/30 dark:text-slate-300",
  },
  [EstadoFactura.ACTIVE]: {
    variant: "outline",
    className:
      "border-amber-500/50 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300",
  },
  [EstadoFactura.PAID]: {
    variant: "secondary",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  [EstadoFactura.OVERDUE]: {
    variant: "destructive",
    className:
      "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  },
  [EstadoFactura.ANULATED]: {
    variant: "secondary",
    className: "bg-muted text-muted-foreground line-through",
  },
};

interface BalanceInvoiceStatusBadgeProps {
  status: EstadoFacturaValue;
  className?: string;
}

export function BalanceInvoiceStatusBadge({
  status,
  className,
}: BalanceInvoiceStatusBadgeProps) {
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
