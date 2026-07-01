import { Suspense } from "react";

import LoadingComponent from "@/components/loading-component";
import { KardexContent } from "@/features/kardex";

export default function KardexPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <KardexContent />
    </Suspense>
  );
}
