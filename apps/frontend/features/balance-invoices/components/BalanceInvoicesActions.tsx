import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function BalanceInvoicesActions() {
  return (
    <Button asChild className="w-full cursor-pointer sm:w-auto">
      <Link href="/balance-invoices/create">
        <Plus className="mr-2 size-4" aria-hidden />
        <span className="sm:inline">New Balance Invoice</span>
      </Link>
    </Button>
  );
}
