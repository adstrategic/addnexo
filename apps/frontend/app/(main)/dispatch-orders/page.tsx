"use client";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DispatchOrdersContent } from "@/features/dispatch-orders";
import LoadingComponent from "@/components/loading-component";
import { hasClientPermissions } from "@/lib/permissions";

export default function DispatchOrdersPage() {
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
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <DispatchOrdersContent />
    </Suspense>
  );
}
