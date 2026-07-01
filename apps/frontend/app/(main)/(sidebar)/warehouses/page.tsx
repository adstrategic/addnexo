"use client";

import { Suspense } from "react";
import { WarehousesContent } from "@/features/warehouses";
import LoadingComponent from "@/components/loading-component";

export default function WarehousesPage() {

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <WarehousesContent />
    </Suspense>
  );
}
