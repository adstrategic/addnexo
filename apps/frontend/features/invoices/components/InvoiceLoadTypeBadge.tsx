import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvoiceLoadTypeBadgeProps {
  isBalanceInvoice: boolean;
  className?: string;
}

export function InvoiceLoadTypeBadge({
  isBalanceInvoice,
  className,
}: InvoiceLoadTypeBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium",
        isBalanceInvoice
          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
        className,
      )}
    >
      {isBalanceInvoice ? "Balance invoice" : "Dispatch order"}
    </Badge>
  );
}
