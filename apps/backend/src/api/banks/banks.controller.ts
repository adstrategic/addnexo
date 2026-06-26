import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./banks.service.js";
import { CreateBankDto, UpdateBankDto } from "./banks.validator.js";

/**
 * Handler to list banks with pagination and search
 */
export const listBanksHandler = async (
  req: Request<{}, {}, {}, { page?: string; search?: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query;
  const limit = 10;

  const { banks, total } = await service.listBanks({
    page: Number(page),
    limit,
    search,
    organizationId,
  });

  res.status(200).json({
    data: banks,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler to get a bank by sequence
 */
export const getBankBySequenceHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const bank = await service.getBankBySequence(
    Number(secuencia),
    organizationId,
  );

  res.status(200).json(bank);
};

/**
 * Handler to create a bank
 */
export const createBankHandler = async (
  req: Request<{}, {}, CreateBankDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const bank = await service.createBank(data, organizationId, userEmail);

  res.status(201).json(bank);
};

/**
 * Handler to update a bank
 */
export const updateBankHandler = async (
  req: Request<{ secuencia: string }, {}, UpdateBankDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const { secuencia } = req.params;
  const data = req.body;

  const bank = await service.updateBank(
    Number(secuencia),
    data,
    organizationId,
    userEmail,
  );

  res.status(200).json(bank);
};

/**
 * Handler to delete a bank
 */
export const deleteBankHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  await service.deleteBank(Number(secuencia), organizationId);

  res.status(204).send();
};
