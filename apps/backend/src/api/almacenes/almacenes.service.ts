import { Prisma, prisma } from "@repo/db";

import { ActualizarAlmacenDto, AlmacenDto } from "./almacenes.validator.js";

interface ListAlmacenesOptions {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
}

export const listAlmacenes = async (options: ListAlmacenesOptions) => {
  const { limit, organizationId, page, search } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.AlmacenWhereInput = {
    ALOrganizationId: organizationId,
  };

  if (search) {
    where.OR = [
      { ALNombre: { contains: search, mode: "insensitive" as const } },
      { ALResponsable: { contains: search, mode: "insensitive" as const } },
      { ALDireccion: { contains: search, mode: "insensitive" as const } },
      { ALTelefono: { contains: search, mode: "insensitive" as const } },
      {
        ciudad: {
          nombre: { contains: search, mode: "insensitive" as const },
        },
      },
    ];
  }

  const [almacenes, total] = await prisma.$transaction([
    prisma.almacen.findMany({
      include: {
        ciudad: { include: { estado: { include: { pais: true } } } },
      },
      orderBy: { ALNombre: "asc" },
      skip,
      take: limit,
      where,
    }),
    prisma.almacen.count({ where }),
  ]);

  return { almacenes, total };
};

export const getAlmacenBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  return prisma.almacen.findUnique({
    include: {
      ciudad: { include: { estado: { include: { pais: true } } } },
    },
    where: {
      ALOrganizationId_ALOrgSecuencia: {
        ALOrganizationId: organizationId,
        ALOrgSecuencia: orgSecuencia,
      },
    },
  });
};

export const createAlmacen = async (
  data: AlmacenDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    const ultimoSecuencial = await tx.almacen.findFirst({
      orderBy: { ALOrgSecuencia: "desc" },
      where: { ALOrganizationId: organizationId },
    });

    const siguienteSecuencial = (ultimoSecuencial?.ALOrgSecuencia ?? 0) + 1;

    const createData: Prisma.AlmacenUncheckedCreateInput = {
      ...data,
      ALOrganizationId: organizationId,
      ALOrgSecuencia: siguienteSecuencial,
      usuario,
    };
    return tx.almacen.create({ data: createData });
  });
};

export const updateAlmacen = async (id: number, data: ActualizarAlmacenDto) => {
  return prisma.almacen.update({
    data,
    where: { ALId: id },
  });
};

export const deleteAlmacen = async (id: number) => {
  await prisma.almacen.delete({ where: { ALId: id } });
};
