"use client";

import type React from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { RoleRouteGuard } from "@/components/RoleRouteGuard";
import { PeriodClosingGuard } from "@/components/period/PeriodClosingGuard";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { PeriodProvider } from "@/lib/context/period-context";

export function MainLayoutGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth requireOrg>
      <RoleRouteGuard>
        <PeriodProvider>
          <PeriodClosingGuard />
          <LayoutWrapper>{children}</LayoutWrapper>
        </PeriodProvider>
      </RoleRouteGuard>
    </RequireAuth>
  );
}
