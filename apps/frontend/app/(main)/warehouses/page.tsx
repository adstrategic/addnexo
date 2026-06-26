"use client";

import { Suspense } from "react";
import { AlmacenContent } from "@/features/warehouses";
import LoadingComponent from "@/components/loading-component";
import { hasClientPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default function WarehousesPage() {
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
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <AlmacenContent />
    </Suspense>
  );
}
