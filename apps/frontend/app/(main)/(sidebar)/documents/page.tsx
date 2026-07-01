"use client";

import { Suspense } from "react";
import { DocumentsContent } from "@/features/documents";
import LoadingComponent from "@/components/loading-component";

export default function DocumentsPage() {

  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
