import { prisma, Prisma } from "@repo/db";

import {
  EntityNotFoundError,
  EntityValidationError,
  FieldValidationError,
} from "../../errors/EntityErrors.js";
import {
  ActualizarProductoDto,
  CrearProductoDto,
} from "./catalogo.validator.js";

const productoInclude = {
  grupo: true,
  unidadDeMedida: true,
  origenPais: {
    select: {
      id: true,
      nombre: true,
      codigo: true,
    },
  },
} satisfies Prisma.InvcaruniInclude;

function buildTextSearchFilter(
  search: string | undefined,
): Prisma.InvcaruniWhereInput | null {
  if (!search?.trim()) return null;
  return {
    OR: [
      { CKDescripcion: { contains: search, mode: "insensitive" } },
      {
        origenPais: {
          is: {
            nombre: { contains: search, mode: "insensitive" },
          },
        },
      },
    ],
  };
}

interface ListProductosOptions {
  excludeGrupoNro?: number;
  grupoId?: number;
  grupoNro?: number;
  limit: number;
  organizationId: string;
  page: number;
  /** Origin country id (matches Invcaruni.CKOrigenId). */
  paisId?: number;
  search?: string;
  unidadMedidaId?: number;
}

export const listProductos = async (options: ListProductosOptions) => {
  const {
    page,
    limit,
    search,
    grupoId,
    grupoNro,
    paisId,
    unidadMedidaId,
    excludeGrupoNro,
    organizationId,
  } = options;

  const skip = (page - 1) * limit;
  const textSearch = buildTextSearchFilter(search);

  const conditions: Prisma.InvcaruniWhereInput[] = [
    { CKOrganizationId: organizationId },
  ];

  if (textSearch) conditions.push(textSearch);
  if (grupoId) conditions.push({ CKGrupoId: grupoId });
  if (grupoNro) {
    conditions.push({ grupo: { GNro: grupoNro } });
  } else if (excludeGrupoNro) {
    conditions.push({ grupo: { GNro: { not: excludeGrupoNro } } });
  }
  if (paisId) conditions.push({ CKOrigenId: paisId });
  if (unidadMedidaId) conditions.push({ CKUnidadMedidaId: unidadMedidaId });

  const where: Prisma.InvcaruniWhereInput = { AND: conditions };

  const [productos, total] = await prisma.$transaction([
    prisma.invcaruni.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ grupo: { GNro: "asc" } }, { CKCodigo: "asc" }],
      include: productoInclude,
    }),
    prisma.invcaruni.count({ where }),
  ]);

  return { productos, total };
};

export const createProducto = async (
  data: CrearProductoDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    const grupo = await tx.invgrupos.findUnique({
      where: { GId: data.CKGrupoId },
    });
    if (!grupo)
      throw new EntityNotFoundError(
        `The group with ID ${String(data.CKGrupoId)} does not exist.`,
      );

    const unidad = await tx.unidadMedida.findUnique({
      where: { UMId: data.CKUnidadMedidaId },
    });
    if (!unidad)
      throw new EntityNotFoundError(
        `The unit of measure with ID ${String(data.CKUnidadMedidaId)} does not exist.`,
      );

    const pais = await tx.pais.findUnique({
      where: { id: data.CKOrigenId },
      select: { id: true },
    });
    if (!pais) {
      throw new EntityNotFoundError(
        `The country with ID ${String(data.CKOrigenId)} does not exist.`,
      );
    }

    if (data.CKExento) {
      data.CKIva = 0;
    }

    if (data.CKPorcenMargenTopeDesc > 0 && data.CKTopeDescuento > 0) {
      throw new EntityValidationError(
        "The discount limit must be assigned as percentage or value, not both.",
      );
    }

    const ultimoProducto = await tx.invcaruni.findFirst({
      where: { CKGrupoId: data.CKGrupoId, CKOrganizationId: organizationId },
      orderBy: { CKCodigo: "desc" },
    });

    const siguienteCodigo = ultimoProducto
      ? Number(ultimoProducto.CKCodigo) + 1
      : 1;

    const ultimoSecuencial = await tx.invcaruni.findFirst({
      where: { CKOrganizationId: organizationId },
      orderBy: { CKOrgSecuencia: "desc" },
    });

    const siguienteSecuencial = (ultimoSecuencial?.CKOrgSecuencia ?? 0) + 1;

    return tx.invcaruni.create({
      data: {
        ...data,
        CKCodigo: siguienteCodigo,
        CKOrganizationId: organizationId,
        CKOrgSecuencia: siguienteSecuencial,
        usuario,
      },
    });
  });
};

export const updateProducto = async (
  id: number,
  data: ActualizarProductoDto,
  organizationId: string,
) => {
  const productoActual = await prisma.invcaruni.findUnique({
    where: { CKId: id },
    select: {
      CKId: true,
      CKOrganizationId: true,
      CKGrupoId: true,
      CKUnidadMedidaId: true,
    },
  });

  if (!productoActual || productoActual.CKOrganizationId !== organizationId) {
    throw new EntityNotFoundError(
      "Product not found or does not belong to the organization.",
    );
  }

  if (data.CKPorcenMargenTopeDesc && data.CKTopeDescuento) {
    throw new FieldValidationError({
      message:
        "The discount limit must be assigned as percentage or value, not both.",
      fields: {
        CKPorcenMargenTopeDesc: [
          "The discount limit must be assigned as percentage or value, not both.",
        ],
        CKTopeDescuento: [
          "The discount limit must be assigned as percentage or value, not both.",
        ],
      },
      statusCode: 400,
      code: "ERR_VALID",
    });
  }

  if (data.CKExento) {
    data.CKIva = 0;
  }

  if (data.CKGrupoId && data.CKGrupoId !== productoActual.CKGrupoId) {
    throw new EntityValidationError(
      "You cannot change the group of a product.",
    );
  }

  if (
    data.CKUnidadMedidaId &&
    data.CKUnidadMedidaId !== productoActual.CKUnidadMedidaId
  ) {
    throw new EntityValidationError(
      "You cannot change the unit of measure of a product.",
    );
  }

  if (data.CKOrigenId !== undefined && data.CKOrigenId !== null) {
    const pais = await prisma.pais.findUnique({
      where: { id: data.CKOrigenId },
      select: { id: true },
    });
    if (!pais) {
      throw new EntityNotFoundError(
        `The country with ID ${String(data.CKOrigenId)} does not exist.`,
      );
    }
  }

  return prisma.invcaruni.update({
    where: { CKId: id },
    data,
  });
};

export const getProductoBySecuencia = async (
  organizationId: string,
  orgSecuencia: number,
) => {
  return prisma.invcaruni.findUnique({
    where: {
      CKOrganizationId_CKOrgSecuencia: {
        CKOrganizationId: organizationId,
        CKOrgSecuencia: orgSecuencia,
      },
    },
    include: productoInclude,
  });
};

export const deleteProducto = async (id: number, organizationId: string) => {
  const producto = await prisma.invcaruni.findUnique({
    where: { CKId: id },
    select: { CKOrganizationId: true },
  });

  if (!producto || producto.CKOrganizationId !== organizationId) {
    throw new EntityNotFoundError(
      "Product not found or does not belong to the organization.",
    );
  }

  try {
    return await prisma.invcaruni.delete({
      where: { CKId: id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new EntityValidationError(
        "Cannot delete this product because it is referenced by other records.",
      );
    }
    throw error;
  }
};
