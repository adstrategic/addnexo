import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function DispatchOrderActions() {
  return (
    <div className="flex gap-2">
      {/* Primary Action - Create Dispatch Order */}
      <Button asChild className="gap-2">
        <Link href="/dispatch-orders/create">
          <Plus className="h-4 w-4" />
          Create Dispatch Order
        </Link>
      </Button>
    </div>
  );
}
