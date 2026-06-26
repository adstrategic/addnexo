// import activarCiudad from "../../utils/activarCiudad";
// import { verificarYDesactivarCiudad } from "../locations/locations.service";
import { type Prisma, prisma } from "@repo/db";

import {
  EntityNotFoundError,
  FieldValidationError,
} from "../../errors/EntityErrors.js";
import {
  ActualizarProveedorDto,
  CrearProveedorDto,
} from "./proveedores.validator.js";

/**
 * Obtiene una lista paginada y filtrada de proveedores.
 * Lógica extraída de tu endpoint GET /.
 */
function buildProveedoresSearchWhere(
  organizationId: string,
  search?: string,
  countryId?: number,
): Prisma.MprovedWhereInput {
  const trimmedSearch = search?.trim();
  const andConditions: Prisma.MprovedWhereInput[] = [
    { MPOrganizationId: organizationId },
  ];

  if (countryId) {
    andConditions.push({
      ciudad: {
        estado: {
          paisId: countryId,
        },
      },
    });
  }

  if (trimmedSearch) {
    andConditions.push({
      OR: [
        {
          MPDescripcion: { contains: trimmedSearch, mode: "insensitive" },
        },
        {
          MPResponsable: { contains: trimmedSearch, mode: "insensitive" },
        },
        { MPNro: { contains: trimmedSearch, mode: "insensitive" } },
        { MPDireccion: { contains: trimmedSearch, mode: "insensitive" } },
        { MPTelefono1: { contains: trimmedSearch, mode: "insensitive" } },
        {
          MPTelefono2: { contains: trimmedSearch, mode: "insensitive" },
        },
        { MPCorreo1: { contains: trimmedSearch, mode: "insensitive" } },
        { MPCorreo2: { contains: trimmedSearch, mode: "insensitive" } },
        {
          ciudad: {
            nombre: { contains: trimmedSearch, mode: "insensitive" },
          },
        },
        {
          ciudad: {
            estado: {
              nombre: { contains: trimmedSearch, mode: "insensitive" },
            },
          },
        },
        {
          ciudad: {
            estado: {
              pais: {
                nombre: { contains: trimmedSearch, mode: "insensitive" },
              },
            },
          },
        },
      ],
    });
  }

  return andConditions.length === 1
    ? andConditions[0]!
    : { AND: andConditions };
}

export const listProveedores = async (options: {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
  countryId?: number;
}) => {
  const { page, limit, organizationId, search, countryId } = options;

  const skip = (page - 1) * limit;
  const where = buildProveedoresSearchWhere(
    organizationId,
    search,
    countryId,
  );

  const [proveedores, total] = await prisma.$transaction([
    prisma.mproved.findMany({
      where,
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
      },
      skip,
      take: limit,
    }),
    prisma.mproved.count({ where }),
  ]);

  return {
    proveedores,
    total,
  };
};

/**
 * Obtiene un proveedor por su Nro/NIT.
 */
export const getProveedorBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  return prisma.mproved.findUnique({
    where: {
      MPOrganizationId_MPOrgSecuencia: {
        MPOrganizationId: organizationId,
        MPOrgSecuencia: orgSecuencia,
      },
    },
    include: {
      ciudad: { include: { estado: { include: { pais: true } } } },
    },
  });
};

/**
 * Crea un nuevo proveedor.
 * Lógica extraída de tu endpoint POST.
 */
export const createProveedor = async (
  data: CrearProveedorDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // Verificar que la ciudad existe
    const ciudad = await tx.ciudad.findUnique({
      where: { id: data.MPCiudadId },
    });
    if (!ciudad) {
      throw new EntityNotFoundError("The specified city does not exist.");
    }

    // Verificar si el proveedor ya existe para esta organización
    const proveedorExistente = await tx.mproved.findUnique({
      where: {
        MPNro_MPOrganizationId: {
          MPNro: data.MPNro,
          MPOrganizationId: organizationId,
        },
      },
    });

    if (proveedorExistente) {
      throw new FieldValidationError({
        message: `The supplier with NIT ${data.MPNro} already exists.`,
        fields: {
          MPNro: [`The supplier with NIT ${data.MPNro} already exists.`],
        },
        statusCode: 400,
        code: "ERR_VALID",
      });
    }

    // 1. Calcular el siguiente orgSecuencia disponible
    const ultimoSecuencial = await tx.mproved.findFirst({
      where: { MPOrganizationId: organizationId },
      orderBy: { MPOrgSecuencia: "desc" },
    });

    const siguienteSecuencial = (ultimoSecuencial?.MPOrgSecuencia ?? 0) + 1;

    const nuevoProveedor = await tx.mproved.create({
      data: {
        ...data,
        MPOrganizationId: organizationId,
        usuario: usuario,
        MPOrgSecuencia: siguienteSecuencial,
      },
      include: {
        ciudad: { include: { estado: { include: { pais: true } } } },
      },
    });

    // Activar la ciudad dentro de la misma transacción
    // await activarCiudad(nuevoProveedor.MPCiudadId, organizationId, tx);

    return nuevoProveedor;
  });
};

/**
 * Actualiza un proveedor existente.
 * Lógica extraída de tu endpoint PUT.
 */
export const updateProveedor = async (
  id: number,
  data: ActualizarProveedorDto,
  organizationId: string,
) => {
  const proveedor = await prisma.mproved.findUnique({
    where: { MPId: id },
  });
  if (proveedor?.MPOrganizationId !== organizationId) {
    throw new EntityNotFoundError("The supplier does not exist.");
  }

  // Si se actualiza la ciudad, verificar que existe
  if (data.MPCiudadId) {
    const ciudad = await prisma.ciudad.findUnique({
      where: { id: data.MPCiudadId },
    });
    if (!ciudad) {
      throw new EntityNotFoundError("The specified city does not exist.");
    }

    if (proveedor.MPCiudadId !== data.MPCiudadId) {
      // await verificarYDesactivarCiudad(proveedor.MPCiudadId, organizationId);
      // await activarCiudad(data.MPCiudadId, organizationId);
    }
  }

  return prisma.mproved.update({
    where: { MPId: id },
    data,
    include: {
      ciudad: { include: { estado: { include: { pais: true } } } },
    },
  });
};

/**
 * Elimina un proveedor.
 * Lógica extraída de tu endpoint DELETE.
 */
export const deleteProveedor = async (id: number, organizationId: string) => {
  const proveedor = await prisma.mproved.findUnique({
    where: { MPId: id },
    select: { MPOrganizationId: true },
  });
  if (!proveedor) {
    throw new EntityNotFoundError("The supplier does not exist.");
  }

  if (proveedor.MPOrganizationId !== organizationId) {
    throw new EntityNotFoundError(
      "The supplier does not belong to the organization.",
    );
  }

  const deletedProveedor = await prisma.mproved.delete({
    where: { MPId: id },
  });

  // await verificarYDesactivarCiudad(
  //   deletedProveedor.MPCiudadId,
  //   organizationId
  // );

  return deletedProveedor;
};
