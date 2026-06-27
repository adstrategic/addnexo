"use client";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DocumentsContent } from "@/features/documents";
import LoadingComponent from "@/components/loading-component";
import { hasClientPermissions } from "@/lib/permissions";

export default function DocumentsPage() {
  const hasPermission = hasClientPermissions("admin", "organization", [
    "read",
    "create",
    "update",
    "delete",
  ]);

  if (!hasPermission) {
    redirect("/");
  }

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
