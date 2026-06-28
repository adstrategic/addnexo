"use client";

import type React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { LoadingComponent } from "@/components/loading-component";

/**
 * UX-only route guard. Redirects the user to the shortcuts page ("/") if their
 * role cannot access the current route. Real enforcement lives on the backend;
 * this just avoids rendering pages the user has no access to.
 *
 * Must be used after authentication/active-org are resolved (inside RequireAuth).
 */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, canAccessPath } = useRole();

  const allowed = !isLoading && canAccessPath(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!canAccessPath(pathname)) {
      router.replace("/");
    }
  }, [isLoading, pathname, canAccessPath, router]);

  if (isLoading || !allowed) {
    return (
      <div className="flex min-h-[200px] w-full items-center justify-center">
        <LoadingComponent variant="dashboard" rows={4} />
      </div>
    );
  }

  return <>{children}</>;
}
