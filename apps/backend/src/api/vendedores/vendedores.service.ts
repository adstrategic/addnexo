import { prisma, type Prisma } from "@repo/db";

import {
  ActualizarVendedorDto,
  CrearVendedorDto,
  ListVendedoresQuery,
} from "./vendedores.validator.js";

interface ListVendedoresOptions extends ListVendedoresQuery {
  limit: number;
  organizationId: string;
}

// ===== SERVICIOS DE LISTADO Y CONSULTA =====

/**
 * Lista todos los clientes con paginación y búsqueda
 */
export const listVendedores = async (options: ListVendedoresOptions) => {
  const { page, limit, search, organizationId } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.VendedorWhereInput = { VOrganizationId: organizationId };
  if (search) {
    where.OR = [
      { VNombre: { contains: search, mode: "insensitive" } },
      { VCorreo: { contains: search, mode: "insensitive" } },
      { VTelefono: { contains: search, mode: "insensitive" } },
      { VNitCedula: { contains: search, mode: "insensitive" } },
    ];
  }

  const [vendedores, total] = await prisma.$transaction([
    prisma.vendedor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { VOrgSecuencia: "asc" },
    }),
    prisma.vendedor.count({ where }),
  ]);

  return { vendedores, total };
};

/**
 * Obtiene un cliente por su secuencia en la organización
 */
export const getVendedorBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  return prisma.vendedor.findUnique({
    where: {
      VOrganizationId_VOrgSecuencia: {
        VOrganizationId: organizationId,
        VOrgSecuencia: orgSecuencia,
      },
    },
  });
};

/**
 * Obtiene el siguiente número de secuencia disponible
 */
export const getSiguienteNumeroVendedor = async (
  tx: Prisma.TransactionClient,
  organizationId: string,
) => {
  const ultimoVendedor = await tx.vendedor.findFirst({
    where: { VOrganizationId: organizationId },
    orderBy: { VOrgSecuencia: "desc" },
  });

  return (ultimoVendedor?.VOrgSecuencia ?? 0) + 1;
};

// ===== CREACIÓN Y ACTUALIZACIÓN =====

/**
 * Crea un nuevo cliente
 */
export const createVendedor = async (
  data: CrearVendedorDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que el NIT/Cedula no exista ya
    const vendedorExistente = await tx.vendedor.findUnique({
      where: {
        VNitCedula_VOrganizationId: {
          VNitCedula: data.VNitCedula,
          VOrganizationId: organizationId,
        },
      },
    });

    if (vendedorExistente) {
      throw new Error(
        `Vendor with NIT/Cedula ${data.VNitCedula} already exists`,
      );
    }

    // 2. Calcular siguiente secuencia
    const siguienteSecuencia = await getSiguienteNumeroVendedor(
      tx,
      organizationId,
    );

    // 3. Crear vendedor
    return tx.vendedor.create({
      data: {
        ...data,
        VOrganizationId: organizationId,
        VOrgSecuencia: siguienteSecuencia,
        usuario,
      },
    });
  });
};

/**
 * Actualiza un cliente existente
 */
export const updateVendedor = async (
  id: number,
  data: ActualizarVendedorDto,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Buscar cliente
    const vendedorExistente = await tx.vendedor.findUnique({
      where: {
        VId: id,
      },
    });

    if (!vendedorExistente) {
      throw new Error("Vendor not found");
    }

    // 4. Si se está actualizando NIT/Cedula, validar que no exista
    if (data.VNitCedula && data.VNitCedula !== vendedorExistente.VNitCedula) {
      const vendedorExistente = await tx.vendedor.findUnique({
        where: {
          VNitCedula_VOrganizationId: {
            VNitCedula: data.VNitCedula,
            VOrganizationId: organizationId,
          },
        },
      });

      if (vendedorExistente) {
        throw new Error(
          `Vendor with NIT/Cedula ${data.VNitCedula} already exists`,
        );
      }
    }

    return tx.vendedor.update({
      where: {
        VId: id,
      },
      data: data,
    });
  });
};

/**
 * Elimina un vendedor
 */
export const deleteVendedor = async (id: number, organizationId: string) => {
  // Verificar que el vendedor existe y pertenece a la organización
  const vendedor = await prisma.vendedor.findUnique({
    where: {
      VId: id,
    },
  });

  if (vendedor?.VOrganizationId !== organizationId) {
    throw new Error("Vendor not found");
  }

  // Intentar eliminar
  await prisma.vendedor.delete({
    where: {
      VId: id,
    },
  });
};
