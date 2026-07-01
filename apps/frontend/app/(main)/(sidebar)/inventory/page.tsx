import { Suspense } from "react";

import LoadingComponent from "@/components/loading-component";
import { InventoryContent } from "@/features/inventory";

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
