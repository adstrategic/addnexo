import type { Request, Response } from "express";
import { type TypedRequest } from "zod-express-middleware";
import { prisma } from "@repo/db";
import { getContext } from "../../middleware/context.middleware.js";
import {
  UpdateReminderConfigBody,
  updateReminderConfigSchema,
} from "./reminder-config.validator.js";

export const getReminderConfigHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      statementScheduledRemindersEnabled: true,
      statementClientScope: true,
    },
  });

  if (!organization) {
    return res.status(404).json({ message: "Organization not found." });
  }

  res.status(200).json({
    statementScheduledRemindersEnabled:
      organization.statementScheduledRemindersEnabled,
    statementClientScope: organization.statementClientScope as
      | "overdue"
      | "balance",
  });
};

export const updateReminderConfigHandler = async (
  req: Request<{}, {}, UpdateReminderConfigBody>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { statementScheduledRemindersEnabled, statementClientScope } = req.body;

  const data: Record<string, unknown> = {};
  if (statementScheduledRemindersEnabled !== undefined) {
    data.statementScheduledRemindersEnabled =
      statementScheduledRemindersEnabled;
  }
  if (statementClientScope !== undefined) {
    data.statementClientScope = statementClientScope;
  }

  const updated = await prisma.organization.update({
    where: { id: organizationId },
    data,
    select: {
      statementScheduledRemindersEnabled: true,
      statementClientScope: true,
    },
  });

  res.status(200).json({
    statementScheduledRemindersEnabled:
      updated.statementScheduledRemindersEnabled,
    statementClientScope: updated.statementClientScope as "overdue" | "balance",
  });
};
