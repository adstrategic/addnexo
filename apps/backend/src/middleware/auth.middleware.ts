/* eslint-disable @typescript-eslint/no-namespace */
import type { NextFunction, Request, Response } from "express";

import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../core/auth.js";

/**
 * Session + user returned by auth.api.getSession.
 * Used to type req.auth in protected routes.
 */
export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

/**
 * Permissions shape for requirePermission.
 * Must match the access control statement in @repo/auth-config (organization, member, project).
 */
export type PermissionMap = Record<string, string[]>;

declare global {
  namespace Express {
    interface Request {
      /** Set by requireSession; present on all routes that use auth middleware. */
      auth?: AuthSession;
    }
  }
}

/**
 * Layer 1: Require authenticated session.
 * Calls auth.api.getSession, returns 401 if no session, otherwise sets req.auth and continues.
 */
export function requireSession() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.auth = session;
    next();
  };
}

/**
 * Layer 2: Require an active organization (multi-tenant).
 * Must be used after requireSession. Returns 403 if no active organization.
 */
export function requireActiveOrganization() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const activeOrgId = req.auth.session.activeOrganizationId ?? null;
    if (!activeOrgId) {
      return res.status(403).json({
        error: "No active organization. Set an active organization first.",
      });
    }
    next();
  };
}

/**
 * Layer 3a: Require one of the given organization roles.
 * Must be used after requireSession (and optionally requireActiveOrganization).
 * Calls auth.api.getActiveMemberRole and returns 403 if role not in allowed list.
 */
export function requireRole(allowedRoles: string[]) {
  const set = new Set(allowedRoles);
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { role } = await auth.api.getActiveMemberRole({
        headers: fromNodeHeaders(req.headers),
      });
      const hasRole = set.has(role);
      if (!hasRole) {
        return res.status(403).json({
          detail: "Insufficient role for this resource.",
          error: "Forbidden",
        });
      }
      next();
    } catch {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
}

/**
 * Layer 3b: Require the given permissions (via organization plugin access control).
 * Must be used after requireSession and requireActiveOrganization.
 * Calls auth.api.hasPermission and returns 403 if any permission is missing.
 */
export function requirePermission(permissions: PermissionMap) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const result = await auth.api.hasPermission({
        body: { permissions },
        headers: fromNodeHeaders(req.headers),
      });
      if (!result.success) {
        return res
          .status(403)
          .json({ detail: "Insufficient permissions.", error: "Forbidden" });
      }
      next();
    } catch {
      return res.status(403).json({ error: "Forbidden" });
    }
  };
}
