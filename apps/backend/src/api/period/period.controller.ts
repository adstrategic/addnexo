import type { Request, Response } from "express";

import type { ClosePeriodDto, SetActiveDto } from "./period.validator.js";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./period.service.js";

export const listAvailablePeriodsHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const periods = await service.listAvailablePeriods(organizationId);
  res.status(200).json({ data: periods });
};

export const getActivePeriodHandler = async (req: Request, res: Response) => {
  const { organizationId, userId, mes, ano } = getContext(req);
  const closed = !(await service.isPeriodOpen(organizationId, mes, ano));

  res.status(200).json({
    mes,
    ano,
    label: service.buildPeriodLabel(mes, ano),
    closed,
    userId,
  });
};

export const setActivePeriodHandler = async (
  req: Request<Record<string, never>, unknown, SetActiveDto>,
  res: Response,
) => {
  const { organizationId, userId } = getContext(req);
  const { mes, ano } = req.body;

  const period = await service.setActivePeriod(
    userId,
    organizationId,
    mes,
    ano,
  );
  const closed = !(await service.isPeriodOpen(organizationId, mes, ano));

  res.status(200).json({
    mes: period.mes,
    ano: period.ano,
    label: service.buildPeriodLabel(period.mes, period.ano),
    closed,
  });
};

export const getClosingStatusHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);
  const status = await service.checkClosingStatus(organizationId);
  res.status(200).json(status);
};

export const validatePreCloseHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);
  const mes = Number(req.query.mes);
  const ano = Number(req.query.ano);

  if (
    !Number.isInteger(mes) ||
    mes < 1 ||
    mes > 12 ||
    !Number.isInteger(ano) ||
    ano < 0 ||
    ano > 99
  ) {
    return res
      .status(400)
      .json({ message: "Invalid mes/ano query parameters." });
  }

  const result = await service.validatePreClose(organizationId, mes, ano);
  res.status(200).json(result);
};

export const closePeriodHandler = async (
  req: Request<Record<string, never>, unknown, ClosePeriodDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { mes, ano } = req.body;

  const result = await service.closePeriod(organizationId, mes, ano, userEmail);

  res.status(200).json({
    message: "Period closed successfully.",
    ...result,
    newPeriod: {
      ...result.newPeriod,
      label: service.buildPeriodLabel(
        result.newPeriod.mes,
        result.newPeriod.ano,
      ),
    },
  });
};
