import { prisma, Prisma } from "@repo/db";

import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";
import { CreateBankDto, UpdateBankDto } from "./banks.validator.js";

interface ListBanksOptions {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
}

/**
 * List banks with pagination and optional search
 */
export const listBanks = async (options: ListBanksOptions) => {
  const { page, limit, search, organizationId } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.BankWhereInput = {
    BOrganizationId: organizationId,
  };

  if (search) {
    where.BNombre = { contains: search, mode: "insensitive" };
  }

  const [banks, total] = await prisma.$transaction([
    prisma.bank.findMany({
      where,
      skip,
      take: limit,
      orderBy: { BNombre: "asc" },
    }),
    prisma.bank.count({ where }),
  ]);

  return { banks, total };
};

/**
 * Get a bank by its sequence in the organization
 */
export const getBankBySequence = async (
  secuencia: number,
  organizationId: string,
) => {
  const bank = await prisma.bank.findUnique({
    where: {
      BOrganizationId_BOrgSecuencia: {
        BOrganizationId: organizationId,
        BOrgSecuencia: secuencia,
      },
    },
  });

  if (!bank) {
    throw new EntityNotFoundError("Bank not found");
  }

  return bank;
};

/**
 * Check if a bank is used in any payment records
 */
const isBankInUse = async (bankId: number): Promise<boolean> => {
  const [walletCount, creditCardCount, transferCount, checkCount] =
    await prisma.$transaction([
      prisma.walletPayment.count({ where: { WPBancoId: bankId } }),
      prisma.creditCardPayment.count({ where: { CCPBancoId: bankId } }),
      prisma.transferPayment.count({ where: { TPBancoId: bankId } }),
      prisma.checkPayment.count({ where: { CHPBancoId: bankId } }),
    ]);

  return (
    walletCount > 0 ||
    creditCardCount > 0 ||
    transferCount > 0 ||
    checkCount > 0
  );
};

/**
 * Create a new bank
 */
export const createBank = async (
  data: CreateBankDto,
  organizationId: string,
  usuario: string,
) => {
  const existing = await prisma.bank.findUnique({
    where: {
      BOrganizationId_BNombre: {
        BOrganizationId: organizationId,
        BNombre: data.BNombre,
      },
    },
  });

  if (existing) {
    throw new EntityValidationError(
      "A bank with this name already exists in the organization",
    );
  }

  const lastBank = await prisma.bank.findFirst({
    where: { BOrganizationId: organizationId },
    orderBy: { BOrgSecuencia: "desc" },
  });

  const nextSequence = (lastBank?.BOrgSecuencia ?? 0) + 1;

  return prisma.bank.create({
    data: {
      BOrganizationId: organizationId,
      BNombre: data.BNombre,
      BOrgSecuencia: nextSequence,
      usuario,
    },
  });
};

/**
 * Update a bank (only if not in use)
 */
export const updateBank = async (
  secuencia: number,
  data: UpdateBankDto,
  organizationId: string,
  usuario: string,
) => {
  const bank = await getBankBySequence(secuencia, organizationId);

  const inUse = await isBankInUse(bank.BId);
  if (inUse) {
    throw new EntityValidationError(
      "Cannot update bank name because it is being used in payment records",
    );
  }

  const existingWithName = await prisma.bank.findUnique({
    where: {
      BOrganizationId_BNombre: {
        BOrganizationId: organizationId,
        BNombre: data.BNombre,
      },
    },
  });

  if (existingWithName && existingWithName.BId !== bank.BId) {
    throw new EntityValidationError(
      "A bank with this name already exists in the organization",
    );
  }

  return prisma.bank.update({
    where: { BId: bank.BId },
    data: { BNombre: data.BNombre, usuario },
  });
};

/**
 * Delete a bank (only if not in use)
 */
export const deleteBank = async (secuencia: number, organizationId: string) => {
  const bank = await getBankBySequence(secuencia, organizationId);

  const inUse = await isBankInUse(bank.BId);
  if (inUse) {
    throw new EntityValidationError(
      "Cannot delete bank because it is being used in payment records",
    );
  }

  await prisma.bank.delete({
    where: { BId: bank.BId },
  });
};
