"use client";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DispatchOrderForm } from "@/features/dispatch-orders";
import LoadingComponent from "@/components/loading-component";
import { hasClientPermissions } from "@/lib/permissions";

export default function CreateDispatchOrderPage() {
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
      <DispatchOrderForm mode="create" />
    </Suspense>
  );
}
