"use client";

import { LoadingComponent } from "@/components/loading-component";
import { ProductContent } from "@/features/catalog";
import { hasClientPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function CatalogPage() {
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
      {" "}
      <ProductContent />
    </Suspense>
  );
}
