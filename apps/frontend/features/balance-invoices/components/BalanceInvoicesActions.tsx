import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function BalanceInvoicesActions() {
  return (
    <div className="flex gap-2">
      {/* Primary Action - Create Dispatch Order */}
      <Button asChild className="gap-2">
        <Link href="/balance-invoices/create">
          <Plus className="h-4 w-4" />
          Create Balance Invoice
        </Link>
      </Button>
    </div>
  );
}
