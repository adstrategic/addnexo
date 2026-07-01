export type RoleLabel = {
  name: string;
  description: string;
};

const ROLE_LABELS: Record<string, RoleLabel> = {
  admin: {
    name: "Administrator",
    description: "Full access to manage the organization, members, and all business operations.",
  },
  warehouse_manager: {
    name: "Warehouse Manager",
    description: "Manage inventory, dispatch orders, and warehouse operations.",
  },
};

const DEFAULT_ROLE: RoleLabel = {
  name: "Team Member",
  description: "Standard access to the organization.",
};

export function getRoleLabel(role: string | undefined | null): RoleLabel {
  if (!role) return DEFAULT_ROLE;
  return ROLE_LABELS[role] ?? DEFAULT_ROLE;
}
