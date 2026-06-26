import { Prisma, prisma } from "@repo/db";

import {
  ActualizarUnidadMedidaDto,
  UnidadMedidaDto,
} from "./unidades.validator.js";

interface ListUnidadesOptions {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
}

// Lista, pagina y busca unidades de medida
export const listUnidades = async (options: ListUnidadesOptions) => {
  const { limit, organizationId, page, search } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.UnidadMedidaWhereInput = {
    UMOrganizationId: organizationId,
  };

  if (search) {
    where.OR = [
      { UMNombre: { contains: search, mode: "insensitive" as const } },
      { UMDescripcion: { contains: search, mode: "insensitive" as const } },
    ];
  }

  // Transacción para obtener datos y conteo total de forma eficiente
  const [unidades, total] = await prisma.$transaction([
    prisma.unidadMedida.findMany({
      orderBy: { UMNombre: "asc" },
      skip,
      take: limit,
      where,
    }),
    prisma.unidadMedida.count({ where }),
  ]);

  return { total, unidades };
};

// Obtiene un grupo por su ID
export const getUnidadBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  return prisma.unidadMedida.findUnique({
    where: {
      UMOrganizationId_UMOrgSecuencia: {
        UMOrganizationId: organizationId,
        UMOrgSecuencia: orgSecuencia,
      },
    },
  });
};

// Crea una nueva unidad de medida
export const createUnidad = async (
  data: UnidadMedidaDto,
  organizationId: string,
  usuario: string,
) => {
  // El schema de Prisma ya impone unicidad en el campo 'nombre',
  // por lo que la base de datos rechazará duplicados automáticamente.
  return prisma.$transaction(async (tx) => {
    // 1. Calcular el siguiente orgSecuencia disponible
    const ultimoSecuencial = await tx.unidadMedida.findFirst({
      orderBy: { UMOrgSecuencia: "desc" },
      where: { UMOrganizationId: organizationId },
    });

    const siguienteSecuencial = (ultimoSecuencial?.UMOrgSecuencia ?? 0) + 1;

    return tx.unidadMedida.create({
      data: {
        ...data,
        UMOrganizationId: organizationId,
        UMOrgSecuencia: siguienteSecuencial,
        usuario: usuario, // Campo de auditoría
      },
    });
  });
};

// Actualiza una unidad
export const updateUnidad = async (
  id: number,
  data: ActualizarUnidadMedidaDto,
) => {
  return await prisma.unidadMedida.update({
    data,
    where: { UMId: id },
  });
};

// Elimina una unidad
export const deleteUnidad = async (id: number) => {
  await prisma.unidadMedida.delete({ where: { UMId: id } });
};
