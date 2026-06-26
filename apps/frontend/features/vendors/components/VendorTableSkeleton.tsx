import { Skeleton } from "@/components/ui/skeleton";
import { vendorListPadding } from "./layout/vendor-list-layout";
import { cn } from "@/lib/utils";

export function VendorTableSkeleton() {
  return (
    <div
      className={cn("space-y-3 py-4", vendorListPadding.x)}
      aria-busy="true"
      aria-label="Loading vendors"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-lg border border-border p-4"
        >
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-32 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="size-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}
