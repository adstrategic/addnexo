import { authClient } from "./auth-client";
import { roles, statement } from "@repo/auth-config";

export type Entities = keyof typeof statement;
export type PermissionFor<E extends Entities> = (typeof statement)[E][number];

// Client side
export const hasClientPermissions = <
  E extends Entities,
  P extends PermissionFor<E>,
>(
  role: keyof typeof roles,
  entity: E,
  permissions: P[],
) => {
  return authClient.organization.checkRolePermission({
    permissions: { [entity]: permissions },
    role: role!,
  });
};
