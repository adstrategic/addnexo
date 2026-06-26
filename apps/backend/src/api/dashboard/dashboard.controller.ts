import type { Request, Response } from "express";
import type { ZodType } from "zod";

import { EntityValidationError } from "../../errors/EntityErrors.js";
import { getContext } from "../../middleware/context.middleware.js";
import { getBillingDashboard } from "./billing-dashboard.service.js";
import {
  billingDashboardQuerySchema,
  inventoryDashboardQuerySchema,
} from "./dashboard.validator.js";
import { getInventoryDashboard } from "./inventory-dashboard.service.js";

const parseQuery = <T>(schema: ZodType<T>, query: unknown): T => {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new EntityValidationError(
      issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid query parameters",
    );
  }
  return parsed.data;
};

export const getInventoryDashboardHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId, mes, ano } = getContext(req);
  const query = parseQuery(inventoryDashboardQuerySchema, req.query);

  const data = await getInventoryDashboard({
    ...query,
    organizationId,
    mes,
    ano,
  });

  res.status(200).json(data);
};

export const getBillingDashboardHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const query = parseQuery(billingDashboardQuerySchema, req.query);

  const data = await getBillingDashboard({ ...query, organizationId });

  res.status(200).json(data);
};
