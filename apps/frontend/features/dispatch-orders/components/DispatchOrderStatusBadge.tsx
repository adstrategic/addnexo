import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dispatchOrderUtils } from "../lib/utils";
import type { DispatchOrderEstado } from "../schemas/dispatch-order-response.schema";

const STATUS_STYLES: Record<
  DispatchOrderEstado,
  { className: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: {
    variant: "outline",
    className:
      "border-amber-500/50 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300",
  },
  EMITTED: {
    variant: "secondary",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  },
  DISPATCHED: {
    variant: "default",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  INVOICED: {
    variant: "secondary",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  ANULATED: {
    variant: "secondary",
    className:
      "bg-muted text-muted-foreground line-through",
  },
};

interface DispatchOrderStatusBadgeProps {
  status: DispatchOrderEstado;
  className?: string;
}

export function DispatchOrderStatusBadge({
  status,
  className,
}: DispatchOrderStatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <Badge
      variant={style.variant}
      className={cn("font-medium", style.className, className)}
    >
      {dispatchOrderUtils.obtenerEstadoLabel(status)}
    </Badge>
  );
}
