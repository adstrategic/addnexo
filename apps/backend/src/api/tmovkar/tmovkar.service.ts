import { prisma, type Prisma, TipoPropositoMovkar } from "@repo/db";

import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";
import { FieldValidationError } from "../../errors/EntityErrors.js";
import {
  ActualizarTipoMovimientoDto,
  TipoMovimientoDto,
} from "./tmovkar.validator.js";

interface ListTiposMovimientoOptions {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
}

export const listTiposMovimiento = async (
  options: ListTiposMovimientoOptions,
) => {
  const { page, limit, search, organizationId } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.TmovkarWhereInput = { TOrganizationId: organizationId };
  if (search?.trim()) {
    const searchNumber = parseInt(search, 10);
    const isNumber = !Number.isNaN(searchNumber);
    where.OR = [
      { TDescripcion: { contains: search, mode: "insensitive" } },
      { TAbreviatura: { contains: search, mode: "insensitive" } },
      ...(isNumber ? [{ TClase: searchNumber }] : []),
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.tmovkar.findMany({
      where,
      skip,
      take: limit,
      orderBy: { TOrgSecuencia: "asc" },
    }),
    prisma.tmovkar.count({ where }),
  ]);

  return { tipos: items, total };
};

export const getTipoMovimientoBySecuencia = async (
  organizationId: string,
  orgSecuencia: number,
) => {
  return prisma.tmovkar.findUnique({
    where: {
      TOrganizationId_TOrgSecuencia: {
        TOrganizationId: organizationId,
        TOrgSecuencia: orgSecuencia,
      },
    },
  });
};

export const createTipoMovimiento = async (
  data: TipoMovimientoDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // Validar duplicado por tipo y clase
    const typeDuplicate = await tx.tmovkar.findUnique({
      where: {
        TOrganizationId_TTipo_TClase: {
          TOrganizationId: organizationId,
          TTipo: data.TTipo,
          TClase: data.TClase,
        },
      },
    });
    if (typeDuplicate) {
      throw new FieldValidationError({
        message:
          "There is already a movement type with the same type and class.",
        fields: {
          TClase: [
            "There is already a movement type with the same type and class.",
          ],
        },
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Regla de negocio básica (CTMOV-0): evitar duplicados por abreviatura dentro de la organización
    const dup = await tx.tmovkar.findFirst({
      where: {
        TOrganizationId: organizationId,
        TAbreviatura: data.TAbreviatura,
      },
    });
    if (dup) {
      throw new FieldValidationError({
        message: "There is already a type with the same abbreviation.",
        fields: {
          TAbreviatura: ["There is already a type with the same abbreviation."],
        },
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // Siguiente secuencia organizacional
    const ultimo = await tx.tmovkar.findFirst({
      where: { TOrganizationId: organizationId },
      orderBy: { TOrgSecuencia: "desc" },
    });
    const siguienteSecuencial = (ultimo?.TOrgSecuencia ?? 0) + 1;

    // Crear
    const created = await tx.tmovkar.create({
      data: {
        ...data,
        TValor: 1,
        TOrganizationId: organizationId,
        TOrgSecuencia: siguienteSecuencial,
        usuario,
      },
    });

    return created;
  });
};

export const updateTipoMovimiento = async (
  id: number,
  data: ActualizarTipoMovimientoDto,
  organizationId: string,
) => {
  const actual = await prisma.tmovkar.findUnique({ where: { TId: id } });
  if (actual?.TOrganizationId !== organizationId) {
    throw new EntityNotFoundError(
      "Movement type not found or does not belong to the organization.",
    );
  }

  // Validar propósito: solo se puede asignar si actualmente es null
  // TProposito is excluded from ActualizarTipoMovimientoDto, but we check explicitly for safety
  if ("TProposito" in data && data.TProposito !== undefined) {
    // Si el movimiento actual ya tiene un propósito asignado, no se puede cambiar
    if (actual.TProposito !== null) {
      throw new EntityValidationError(
        "The purpose of a movement type cannot be changed after it has been assigned.",
      );
    }
  }

  // Si cambia abreviatura, validar duplicado
  if (data.TAbreviatura && data.TAbreviatura !== actual.TAbreviatura) {
    const dup = await prisma.tmovkar.findFirst({
      where: {
        TOrganizationId: organizationId,
        TAbreviatura: data.TAbreviatura,
      },
    });
    if (dup) {
      throw new FieldValidationError({
        message:
          "There is already a type with that abbreviation in the organization.",
        fields: {
          TAbreviatura: [
            "There is already a type with that abbreviation in the organization.",
          ],
        },
        statusCode: 400,
        code: "ERR_VALID",
      });
    }
  }

  if (
    (data.TTipo && data.TTipo !== actual.TTipo) ||
    (data.TClase && data.TClase !== actual.TClase)
  ) {
    throw new EntityValidationError(
      "You cannot change the type of movement or class. You must delete this and create a new one.",
    );
  }

  // Un ajuste de inventario es excluyente: valida contra el registro resultante,
  // ya que el payload parcial por sí solo no garantiza la regla.
  const resultante = { ...actual, ...data };
  if (
    resultante.TAjusteInventario &&
    (resultante.TRequiere ||
      resultante.TPedido ||
      resultante.TFactura ||
      resultante.TProv ||
      resultante.TCliente ||
      resultante.TRecalcular ||
      !resultante.TAfecta ||
      resultante.TProposito != null)
  ) {
    throw new EntityValidationError(
      "An inventory adjustment type must affect inventory, cannot have requirement or recalculation options enabled, and cannot have a purpose assigned.",
    );
  }

  return prisma.tmovkar.update({ where: { TId: id }, data });
};

export const deleteTipoMovimiento = async (
  id: number,
  organizationId: string,
) => {
  const actual = await prisma.tmovkar.findUnique({ where: { TId: id } });

  if (actual?.TOrganizationId !== organizationId) {
    throw new EntityNotFoundError(
      "Movement type not found or does not belong to the organization.",
    );
  }

  // Intentar borrar; si hay FK en MOVKAR, Prisma lanzará error (se debe manejar arriba)
  return prisma.tmovkar.delete({ where: { TId: id } });
};

/**
 * Gets the next available class number for a given movement type
 * @param organizationId - Organization ID
 * @param tipo - Movement type (1 = Entry, 2 = Exit)
 * @returns Next available class number (1-99)
 */
export const getNextAvailableClass = async (
  organizationId: string,
  tipo: number,
): Promise<number> => {
  // Find the highest TClase for the given TTipo
  const ultimo = await prisma.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TTipo: tipo,
    },
    orderBy: { TClase: "desc" },
  });

  // Return next available number (max 99)
  const nextClass = (ultimo?.TClase ?? 0) + 1;
  return Math.min(nextClass, 99);
};

/**
 * Obtiene los propósitos disponibles (no asignados) para una organización
 * @param organizationId - ID de la organización
 * @param excludeTmovkarId - Opcional: ID del movimiento a excluir (útil cuando se edita)
 */
export const getAvailablePurposes = async (
  organizationId: string,
  excludeTmovkarId?: number,
) => {
  // Obtener todos los propósitos asignados en la organización
  const whereClause: Prisma.TmovkarWhereInput = {
    TOrganizationId: organizationId,
    TProposito: { not: null },
  };

  // Si se está editando, excluir el movimiento actual de la lista de asignados
  if (excludeTmovkarId) {
    whereClause.TId = { not: excludeTmovkarId };
  }

  const assignedPurposes = await prisma.tmovkar.findMany({
    where: whereClause,
    select: {
      TProposito: true,
    },
  });

  const assignedSet = new Set(
    assignedPurposes
      .map((t) => t.TProposito)
      .filter((p): p is TipoPropositoMovkar => p !== null),
  );

  // Retornar todos los propósitos del enum que no están asignados
  const allPurposes = Object.values(TipoPropositoMovkar);
  return allPurposes.filter((purpose) => !assignedSet.has(purpose));
};
