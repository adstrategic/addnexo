import { type Prisma, prisma } from "@repo/db";

import {
  EntityNotFoundError,
  EntityValidationError,
  FieldValidationError,
} from "../../errors/EntityErrors.js";
import { ActualizarGrupoDto, CrearGrupoDto } from "./grupos.validator.js";

// Lista todos los grupos con paginación y búsqueda
export const listGrupos = async (options: {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
}) => {
  const { limit, organizationId, page, search } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.InvgruposWhereInput = { GOrganizationId: organizationId };
  if (search) {
    const searchNumber = parseInt(search);
    const isNumber = !isNaN(searchNumber);
    where.OR = [
      ...(isNumber ? [{ GNro: searchNumber }] : []),
      { GDescripcion: { contains: search, mode: "insensitive" } },
    ];
  }

  // Ejecutar ambas consultas (obtener datos y contar total) en una transacción
  const [grupos, total] = await prisma.$transaction([
    prisma.invgrupos.findMany({
      orderBy: { GNro: "asc" },
      skip,
      take: limit,
      where,
    }),
    prisma.invgrupos.count({ where }),
  ]);

  return { grupos, total };
};

// Obtiene un grupo por su ID
export const getGrupoBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  return prisma.invgrupos.findUnique({
    where: {
      GOrganizationId_GOrgSecuencia: {
        GOrganizationId: organizationId,
        GOrgSecuencia: orgSecuencia,
      },
    },
  });
};

// Obtiene el siguiente número de grupo disponible
export const getSiguienteNumeroGrupo = async (organizationId: string) => {
  const ultimoGrupo = await prisma.invgrupos.findFirst({
    orderBy: { GNro: "desc" },
    where: { GOrganizationId: organizationId },
  });

  return (ultimoGrupo?.GNro ?? 0) + 1;
};

// Crea un nuevo grupo
export const createGrupo = async (
  data: CrearGrupoDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    const grupoExistente = await prisma.invgrupos.findUnique({
      where: {
        GNro_GOrganizationId: {
          GNro: data.GNro,
          GOrganizationId: organizationId,
        },
      },
    });

    if (grupoExistente) {
      throw new FieldValidationError({
        message: `The group with number ${String(data.GNro)} already exists.`,
        fields: {
          GNro: [`The group with number ${String(data.GNro)} already exists.`],
        },
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // 1. Calcular el siguiente orgSecuencia disponible
    const ultimoSecuencial = await tx.invgrupos.findFirst({
      orderBy: { GOrgSecuencia: "desc" },
      where: { GOrganizationId: organizationId },
    });

    const siguienteSecuencial = (ultimoSecuencial?.GOrgSecuencia ?? 0) + 1;

    return tx.invgrupos.create({
      data: {
        ...data,
        GOrganizationId: organizationId,
        GOrgSecuencia: siguienteSecuencial,
        usuario,
      },
    });
  });
};

// Actualiza un grupo existente
export const updateGrupo = async (
  id: number,
  data: ActualizarGrupoDto,
  organizationId: string,
) => {
  if (data.GNro) {
    throw new EntityValidationError("Can't change group number");
  }

  // Actualizar SOLO si pertenece a la organización
  const result = await prisma.invgrupos.updateMany({
    data,
    where: { GId: id, GOrganizationId: organizationId },
  });

  if (result.count === 0) {
    throw new EntityNotFoundError(
      "Group not found or does not belong to the organization.",
    );
  }

  // Devolver entidad resultante (shape consistente)
  return prisma.invgrupos.findFirst({
    where: { GId: id, GOrganizationId: organizationId },
  });
};

// Elimina un grupo
export const deleteGrupo = async (id: number, organizationId: string) => {
  const result = await prisma.invgrupos.deleteMany({
    where: { GId: id, GOrganizationId: organizationId },
  });

  if (result.count === 0) {
    throw new EntityNotFoundError(
      "Group not found or does not belong to the organization.",
    );
  }
};
