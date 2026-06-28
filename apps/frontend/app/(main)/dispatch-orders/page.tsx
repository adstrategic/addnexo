"use client";

import { Suspense } from "react";
import { DispatchOrdersContent } from "@/features/dispatch-orders";
import LoadingComponent from "@/components/loading-component";

export default function DispatchOrdersPage() {

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <DispatchOrdersContent />
    </Suspense>
  );
}
