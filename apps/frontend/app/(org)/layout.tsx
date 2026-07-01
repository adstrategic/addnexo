import type React from "react";
import { RequireAuth } from "@/components/RequireAuth";
import { PeriodProvider } from "@/lib/context/period-context";
import { LayoutWrapper } from "@/components/layout-wrapper";

/**
 * Layout for the organization-selection flow (e.g. /organizations).
 *
 * Unlike the main app layout, this requires the user to be authenticated but
 * NOT to have an active organization — otherwise a freshly signed-up user with
 * no active org can never reach the page that lets them create/select one
 * (the requireOrg guard would redirect /organizations back to itself, looping).
 *
 * The sidebar (LayoutWrapper) is kept for visual parity with the rest of the
 * app. PeriodProvider is included because the sidebar header renders the
 * PeriodDropdown, which calls usePeriod(); it degrades gracefully to a fallback
 * period when there is no active organization. RoleRouteGuard and
 * PeriodClosingGuard are intentionally omitted here since both assume an active
 * organization.
 */
export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth>
      <PeriodProvider>
        <LayoutWrapper>{children}</LayoutWrapper>
      </PeriodProvider>
    </RequireAuth>
  );
}
