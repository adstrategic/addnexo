import { LoadingComponent } from "@/components/loading-component";
import { VendorsContent } from "@/features/vendors";
import { Suspense } from "react";

export default function VendorsPage() {

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <VendorsContent />
    </Suspense>
  );
}
