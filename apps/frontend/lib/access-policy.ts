import type { roles } from "@repo/auth-config";

/**
 * Application roles, derived from the shared access-control config.
 * "admin" has full access; "warehouse_manager" is limited to dispatch-orders.
 */
export type AppRole = keyof typeof roles;

/**
 * Route-access policy (UX gating only — the backend is the real enforcement).
 *
 * Rule: admin can access everything. warehouse_manager can access the shortcuts
 * page and dispatch-orders, EXCEPT subroutes listed in ADMIN_ONLY_OVERRIDES
 * (e.g. the emit page — warehouse_manager has no `emit` action).
 */
const WM_ALLOWED_EXACT = ["/"];
const WM_ALLOWED_PREFIXES = ["/dispatch-orders"];
// Patterns may use "*" to match a single dynamic path segment.
const ADMIN_ONLY_OVERRIDES = ["/dispatch-orders/*/emit"];

function matchesPattern(path: string, pattern: string): boolean {
  const escaped = pattern
    .split("/")
    .map((seg) =>
      seg === "*" ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${escaped}$`).test(path);
}

/**
 * Whether the given role may access the given pathname.
 * Returns false when the role is not yet resolved.
 */
export function canAccessPath(role: AppRole | undefined, path: string): boolean {
  if (role === "admin") return true;
  if (role !== "warehouse_manager") return false;

  // Admin-only overrides win over the allowlist.
  if (ADMIN_ONLY_OVERRIDES.some((pattern) => matchesPattern(path, pattern))) {
    return false;
  }

  if (WM_ALLOWED_EXACT.includes(path)) return true;
  return WM_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
