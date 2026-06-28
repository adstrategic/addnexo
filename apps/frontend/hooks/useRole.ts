"use client";

import { authClient } from "@/lib/auth-client";
import { type AppRole, canAccessPath } from "@/lib/access-policy";

/**
 * Permission map accepted by Better Auth's local checkRolePermission.
 * checkRolePermission's argument is a union (`{ permission }` | `{ permissions }`);
 * distribute over it to pick the multi-resource `permissions` branch.
 */
type PermsOf<T> = T extends { permissions: infer P } ? P : never;
type PermissionRequest = PermsOf<
  Parameters<typeof authClient.organization.checkRolePermission>[0]
>;

/**
 * Resolves the logged-in user's *actual* role in the active organization and
 * exposes UX-gating helpers. The role comes from the active org membership
 * (same pattern as periodo-guard), never a hardcoded value.
 */
export function useRole() {
  const { data: org, isPending: orgPending } =
    authClient.useActiveOrganization();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const role = org?.members?.find((m) => m.userId === session?.user?.id)
    ?.role as AppRole | undefined;

  const isLoading = orgPending || sessionPending;

  return {
    role,
    isLoading,
    /** Whether the current user may access a given route. */
    canAccessPath: (path: string) => canAccessPath(role, path),
    /**
     * Local (synchronous) permission check against the user's real role.
     * Use for action-level UI (e.g. hiding emit/delete/void buttons).
     */
    can: (permissions: PermissionRequest) => {
      if (!role) return false;
      return authClient.organization.checkRolePermission({
        permissions,
        role,
      });
    },
  };
}
