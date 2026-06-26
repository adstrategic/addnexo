import { cn, getDaysFromDueDate } from "@/lib/utils";
import { EstadoInvoice } from "../schemas/invoices-response.schema";

interface InvoiceDueIndicatorProps {
  dueDate: string | Date;
  status: EstadoInvoice;
  className?: string;
}

export function InvoiceDueIndicator({
  dueDate,
  status,
  className,
}: InvoiceDueIndicatorProps) {
  if (status === EstadoInvoice.PAID) {
    return <span className={cn("text-muted-foreground", className)}>Paid</span>;
  }

  const { days } = getDaysFromDueDate(dueDate);

  if (days === null) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  if (days < 0) {
    return (
      <span className={cn("font-medium text-blue-600 dark:text-blue-400", className)}>
        {Math.abs(days)}d early
      </span>
    );
  }

  if (days === 0) {
    return (
      <span className={cn("font-medium text-amber-600 dark:text-amber-400", className)}>
        Due today
      </span>
    );
  }

  return (
    <span className={cn("font-medium text-red-600 dark:text-red-400", className)}>
      {days}d overdue
    </span>
  );
}
