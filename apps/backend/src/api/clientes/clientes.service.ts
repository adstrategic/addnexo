import { prisma, type Prisma } from "@repo/db";

import { EntityNotFoundError } from "../../errors/EntityErrors.js";
import { mapClienteListToApi, mapClienteToApi } from "./clientes.mapper.js";
import {
  ActualizarClienteDto,
  CrearClienteDto,
  ListClientesQuery,
} from "./clientes.validator.js";

interface ListClientesOptions extends ListClientesQuery {
  limit: number;
  organizationId: string;
}

// ===== SERVICIOS DE LISTADO Y CONSULTA =====

/**
 * Lista todos los clientes con paginación y búsqueda
 */
export const listClientes = async (options: ListClientesOptions) => {
  const { page, limit, search, organizationId } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.CltemaeWhereInput = { COrganizationId: organizationId };
  if (search) {
    where.OR = [
      { CNitCedula: { contains: search, mode: "insensitive" } },
      { CRazonSocial: { contains: search, mode: "insensitive" } },
      { CNombreCliente: { contains: search, mode: "insensitive" } },
    ];
  }

  const [clientes, total] = await prisma.$transaction([
    prisma.cltemae.findMany({
      where,
      skip,
      take: limit,
      orderBy: { COrgSecuencia: "asc" },
      include: {
        ciudad: {
          include: {
            estado: {
              include: {
                pais: true,
              },
            },
          },
        },
        vendedor: true,
      },
    }),
    prisma.cltemae.count({ where }),
  ]);

  return {
    clientes: mapClienteListToApi(clientes),
    total,
  };
};

/**
 * Obtiene un cliente por su secuencia en la organización
 */
export const getClienteBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  const cliente = await prisma.cltemae.findUnique({
    where: {
      COrganizationId_COrgSecuencia: {
        COrganizationId: organizationId,
        COrgSecuencia: orgSecuencia,
      },
    },
    include: {
      ciudad: {
        include: {
          estado: {
            include: {
              pais: true,
            },
          },
        },
      },
      vendedor: true,
    },
  });

  return cliente ? mapClienteToApi(cliente) : null;
};

/**
 * Obtiene el siguiente número de secuencia disponible
 */
export const getSiguienteNumeroCliente = async (
  tx: Prisma.TransactionClient,
  organizationId: string,
) => {
  const ultimoCliente = await tx.cltemae.findFirst({
    where: { COrganizationId: organizationId },
    orderBy: { COrgSecuencia: "desc" },
  });

  return (ultimoCliente?.COrgSecuencia ?? 0) + 1;
};

// ===== CREACIÓN Y ACTUALIZACIÓN =====

/**
 * Crea un nuevo cliente
 */
export const createCliente = async (
  data: CrearClienteDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la ciudad existe
    const ciudad = await tx.ciudad.findUnique({
      where: { id: data.CCiudadId },
    });
    if (!ciudad) {
      throw new Error("City not found");
    }

    // 2. Validar vendedor si se proporciona
    if (data.CVendedorVId) {
      const vendedor = await tx.vendedor.findUnique({
        where: { VId: data.CVendedorVId },
      });
      if (vendedor?.VOrganizationId !== organizationId) {
        throw new Error("Vendor not found or does not belong to organization");
      }
    }

    // 3. Validar que el NIT/Cedula no exista ya
    const clienteExistente = await tx.cltemae.findUnique({
      where: {
        CNitCedula_COrganizationId: {
          CNitCedula: data.CNitCedula,
          COrganizationId: organizationId,
        },
      },
    });

    if (clienteExistente) {
      throw new Error(
        `Customer with NIT/Cedula ${data.CNitCedula} already exists`,
      );
    }

    // 4. Calcular siguiente secuencia
    const siguienteSecuencia = await getSiguienteNumeroCliente(
      tx,
      organizationId,
    );

    // 5. Crear cliente
    const cliente = await tx.cltemae.create({
      data: {
        ...data,
        COrganizationId: organizationId,
        COrgSecuencia: siguienteSecuencia,
        CNitCedula: data.CNitCedula,
        CVendedorVId: data.CVendedorVId ?? null,
        CCorreo2: data.CCorreo2 ?? null,
        CFechaIngreso: data.CFechaIngreso ?? new Date(),
        usuario,
      },
      include: {
        ciudad: true,
        vendedor: true,
      },
    });

    return mapClienteToApi(cliente);
  });
};

/**
 * Actualiza un cliente existente
 */
export const updateCliente = async (
  id: number,
  data: ActualizarClienteDto,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Buscar cliente
    const clienteExistente = await tx.cltemae.findUnique({
      where: {
        CId: id,
      },
    });

    if (!clienteExistente) {
      throw new Error("Customer not found");
    }

    // 2. Si se está actualizando ciudad, validar que existe
    if (data.CCiudadId) {
      const ciudad = await tx.ciudad.findUnique({
        where: { id: data.CCiudadId },
      });
      if (!ciudad) {
        throw new Error("City not found");
      }
    }

    // 3. Si se está actualizando vendedor, validar
    if (data.CVendedorVId) {
      const vendedor = await tx.vendedor.findUnique({
        where: { VId: data.CVendedorVId },
      });
      if (vendedor?.VOrganizationId !== organizationId) {
        throw new Error("Vendor not found or does not belong to organization");
      }
    }

    // 4. Si se está actualizando NIT/Cedula, validar que no exista
    if (data.CNitCedula && data.CNitCedula !== clienteExistente.CNitCedula) {
      const nitExistente = await tx.cltemae.findUnique({
        where: {
          CNitCedula_COrganizationId: {
            CNitCedula: data.CNitCedula,
            COrganizationId: organizationId,
          },
        },
      });

      if (nitExistente) {
        throw new Error(
          `Customer with NIT/Cedula ${data.CNitCedula} already exists`,
        );
      }
    }

    const cliente = await tx.cltemae.update({
      where: {
        CId: id,
      },
      data: data,
      include: {
        ciudad: true,
        vendedor: true,
      },
    });

    return mapClienteToApi(cliente);
  });
};

/**
 * Elimina un cliente
 */
export const deleteCliente = async (id: number, organizationId: string) => {
  // Verificar que el cliente existe y pertenece a la organización
  const cliente = await prisma.cltemae.findUnique({
    where: {
      CId: id,
    },
  });

  if (cliente?.COrganizationId !== organizationId) {
    throw new EntityNotFoundError("Customer not found");
  }

  // Intentar eliminar
  await prisma.cltemae.delete({
    where: {
      CId: id,
    },
  });
};
