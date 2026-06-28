import LoadingComponent from "@/components/loading-component";
import { SuppliersContent } from "@/features/suppliers";
import { Suspense } from "react";

export default function SuppliersPage() {

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <SuppliersContent />
    </Suspense>
  );
}
