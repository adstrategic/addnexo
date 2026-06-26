"use client";

import type React from "react";
import {
  useRequireAuth,
  type UseRequireAuthOptions,
} from "@/hooks/useRequireAuth";
import { LoadingComponent } from "@/components/loading-component";

export type RequireAuthProps = UseRequireAuthOptions & {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RequireAuth({
  children,
  fallback,
  requireOrg,
}: RequireAuthProps) {
  const result = useRequireAuth({ requireOrg });
  if (!result.ready) {
    if (fallback != null) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-[200px] w-full items-center justify-center">
        <LoadingComponent variant="dashboard" rows={4} />
      </div>
    );
  }

  return <>{children}</>;
}
