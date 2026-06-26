import type { NextFunction, Request, Response } from "express";

import {
  currentPeriod,
  getActivePeriod,
} from "../api/period/period.service.js";

export interface RequestContext {
  ano: number;
  mes: number;
  organizationId: string;
  userEmail: string;
  userId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export function getContext(req: Request): RequestContext {
  if (req.context) {
    return req.context;
  }

  if (!req.auth) {
    throw new Error("Unauthorized");
  }

  const organizationId = req.auth.session.activeOrganizationId;
  if (!organizationId) {
    throw new Error("Active organization required");
  }

  const fallback = currentPeriod();
  return {
    organizationId,
    userId: req.auth.user.id,
    userEmail: req.auth.user.email,
    mes: fallback.mes,
    ano: fallback.ano,
  };
}

export async function contextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    if (!req.auth?.session.activeOrganizationId || !req.auth.user.id) {
      next();
      return;
    }

    const organizationId = req.auth.session.activeOrganizationId;
    const userId = req.auth.user.id;
    const userEmail = req.auth.user.email;

    let mes: number;
    let ano: number;

    try {
      const activePeriod = await getActivePeriod(userId, organizationId);
      mes = activePeriod.mes;
      ano = activePeriod.ano;
    } catch {
      const fallback = currentPeriod();
      mes = fallback.mes;
      ano = fallback.ano;
    }

    req.context = {
      organizationId,
      userId,
      userEmail,
      mes,
      ano,
    };

    next();
  } catch (error) {
    next(error);
  }
}
