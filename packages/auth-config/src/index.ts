import { createAccessControl } from "better-auth/plugins/access";

/**
 * Access control statement for the organization plugin.
 * Defines resources and actions for RBAC.
 */
const statement = {
  organization: ["create", "update", "delete", "read", "invite_member", "remove_member", "update_member_role"],
  member: ["read", "update", "remove"],
  project: ["create", "share", "update", "delete", "read"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Roles for multi-tenant organizations.
 * Pass these to the organization plugin on both server and client.
 */
export const owner = ac.newRole({
  organization: ["create", "update", "delete", "read", "invite_member", "remove_member", "update_member_role"],
  member: ["read", "update", "remove"],
  project: ["create", "share", "update", "delete"],
});

export const admin = ac.newRole({
  organization: ["read", "invite_member", "remove_member", "update_member_role"],
  member: ["read", "update", "remove"],
  project: ["create", "share", "update", "delete"],
});

export const warehouseManager = ac.newRole({
  organization: ["read"],
  member: ["read"],
  project: ["create", "update", "read"],
});

export const roles = {
  owner,
  admin,
  warehouseManager,
};
