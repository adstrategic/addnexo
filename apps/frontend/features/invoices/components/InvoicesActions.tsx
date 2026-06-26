import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function InvoicesActions() {
  return (
    <div className="flex gap-2">
      {/* Primary Action - Create Invoice */}
      <Button asChild className="gap-2">
        <Link href="/invoices/create">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      </Button>
    </div>
  );
}
