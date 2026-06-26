import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function DispatchOrderActions() {
  return (
    <Button asChild className="w-full cursor-pointer sm:w-auto">
      <Link href="/dispatch-orders/create">
        <Plus className="mr-2 size-4" aria-hidden />
        <span className="sm:inline">New Dispatch Order</span>
      </Link>
    </Button>
  );
}
