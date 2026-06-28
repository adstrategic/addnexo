import { createAccessControl } from "better-auth/plugins/access";

/**
 * Access control statement for the organization plugin.
 * Defines resources and actions for RBAC.
 *
 * NOTE: `member` and `invitation` resource/action names must match Better Auth's
 * built-in organization routes (it checks `invitation: ["create"]` when inviting,
 * `member: ["delete"]` when removing, etc.). The `organization.*` custom actions
 * (invite_member, …) are only used by our own permission checks.
 */
export const statement = {
  organization: [
    "create",
    "update",
    "delete",
    "read",
    "invite_member",
    "remove_member",
    "update_member_role",
  ],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "cancel", "read"],
  dispatchOrder: [
    "create",
    "read",
    "update",
    "delete",
    "emit",
    "dispatch",
    "void",
  ],
  invoice: ["create", "read", "update", "delete", "emit", "void"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Roles for multi-tenant organizations.
 * Pass these to the organization plugin on both server and client.
 *
 * `admin` is the top role and is assigned to the organization creator
 * (see `creatorRole: "admin"` in the backend auth config).
 */
export const admin = ac.newRole({
  organization: [
    "create",
    "update",
    "delete",
    "read",
    "invite_member",
    "remove_member",
    "update_member_role",
  ],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "cancel", "read"],
  dispatchOrder: [
    "create",
    "read",
    "update",
    "delete",
    "emit",
    "dispatch",
    "void",
  ],
  invoice: ["create", "read", "update", "delete", "emit", "void"],
});

export const warehouse_manager = ac.newRole({
  organization: ["read"],
  member: ["read"],
  invitation: ["read"],
  dispatchOrder: ["create", "update", "read", "dispatch"],
  invoice: [],
});

export const roles = {
  admin,
  warehouse_manager,
};
