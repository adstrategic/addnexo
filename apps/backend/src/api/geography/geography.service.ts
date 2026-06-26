import { prisma, type Prisma } from "@repo/db";

import type { CiudadDto, EstadoDto, PaisDto } from "./geography.validator.js";

// --- Lógica de Países ---
export const createPais = (data: PaisDto, organizationId: string) => {
  return prisma.pais.create({ data: { ...data, organizationId } });
};

export const updatePais = (
  id: number,
  data: Partial<PaisDto>,
  organizationId: string,
) => {
  return prisma.pais.update({ where: { id, organizationId }, data });
};

export const deletePais = async (id: number, organizationId: string) => {
  return await prisma.pais.delete({ where: { id, organizationId } });
};

// --- Lógica de Estados ---
export const createEstado = (
  data: EstadoDto,
  // paisId: number,
  organizationId: string,
) => {
  // TODO: Validar que el pais exista y sea de la organizacion

  return prisma.estado.create({ data: { ...data, organizationId } });
};

export const updateEstado = (
  id: number,
  data: Partial<EstadoDto>,
  organizationId: string,
) => {
  return prisma.estado.update({ where: { id, organizationId }, data });
};

export const deleteEstado = async (id: number, organizationId: string) => {
  return await prisma.estado.delete({ where: { id, organizationId } });
};

// --- Lógica de Ciudades ---
export const createCiudad = (
  data: CiudadDto,
  // estadoId: number,
  organizationId: string,
) => {
  // TODO: Validar que el estado exista y sea de la organizacion

  return prisma.ciudad.create({ data: { ...data, organizationId } });
};

export const updateCiudad = async (
  id: number,
  data: Partial<CiudadDto>,
  organizationId: string,
) => {
  // Actualizar la ciudad solo si es de la organización
  const ciudad = await prisma.ciudad.findUnique({
    where: { id, organizationId },
  });
  if (!ciudad) {
    throw new Error("La ciudad no existe o no pertenece a la organización.");
  }

  return prisma.ciudad.update({ where: { id, organizationId }, data });
};

export const deleteCiudad = async (id: number, organizationId: string) => {
  return await prisma.ciudad.delete({ where: { id, organizationId } });
};

// --- Lógica de Búsqueda ---
export const searchCiudades = (query: string, organizationId: string) => {
  return prisma.ciudad.findMany({
    where: {
      nombre: { contains: query, mode: "insensitive" },
      // Muestra ciudades de la organización O ciudades públicas (sin organización)
      OR: [{ organizationId }, { organizationId: null }],
    },
    include: {
      estado: {
        include: { pais: true },
      },
    },
    take: 20,
    orderBy: { nombre: "asc" },
  });
};

// --- Lógica de Búsqueda ---
export const searchEstados = (query: string, organizationId: string) => {
  const where: Prisma.EstadoWhereInput = {
    OR: [
      { organizationId },
      { organizationId: null }, // Incluir estados públicos
    ],
  };

  // Solo agregar filtro de búsqueda si hay query
  if (query && query.trim().length > 0) {
    where.nombre = {
      contains: query,
      mode: "insensitive",
    };
  }

  return prisma.estado.findMany({
    where,
    include: {
      pais: true,
    },
    take: 10,
    orderBy: { nombre: "asc" },
  });
};

export const getPaisById = (id: number, organizationId: string) => {
  return prisma.pais.findFirst({
    where: {
      id,
      OR: [{ organizationId }, { organizationId: null }],
    },
  });
};

export const searchPaises = (query: string, organizationId: string) => {
  const where: Prisma.PaisWhereInput = {
    OR: [
      { organizationId },
      { organizationId: null }, // Incluir estados públicos
    ],
  };

  // Solo agregar filtro de búsqueda si hay query
  if (query && query.trim().length > 0) {
    where.nombre = {
      contains: query,
      mode: "insensitive",
    };
  }

  return prisma.pais.findMany({
    where,
    take: 10,
    orderBy: { nombre: "asc" },
  });
};

// --- Lógica de Listado de Ciudades con Relaciones ---
interface ListCiudadesConRelacionesOptions {
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
}

export const listCiudadesConRelaciones = async (
  options: ListCiudadesConRelacionesOptions,
) => {
  const { page, limit, search, organizationId } = options;
  const skip = (page - 1) * limit;

  // Construir la cláusula WHERE para ciudades que tengan relaciones
  // const where: any = {
  //   AND: [
  //     {
  //       OR: [
  //         { organizationId },
  //         { organizationId: null }, // Incluir ciudades públicas
  //       ],
  //     },
  //     {
  //       // Ciudades que MI organización ha activado
  //       organizacionesActivas: {
  //         some: {
  //           organizationId,
  //         },
  //       },
  //     },
  //   ],
  // };

  // // Agregar búsqueda si se proporciona
  // if (search) {
  //   where.AND.push({
  //     nombre: { contains: search, mode: "insensitive" },
  //   });
  // }

  let where: Prisma.CiudadWhereInput;

  if (search && search.trim().length > 0) {
    // CON BÚSQUEDA: Incluir ciudades públicas que coincidan
    where = {
      AND: [
        {
          OR: [
            // Ciudades creadas por MI organización
            { organizationId },
            // Ciudades que MI organización ha activado (tienen relaciones)
            {
              ActivatedOrganizationCiudad: {
                some: {
                  organizationId,
                },
              },
            },
            // Ciudades públicas que coincidan con la búsqueda
            {
              AND: [
                { organizationId: null },
                { nombre: { contains: search, mode: "insensitive" } },
              ],
            },
          ],
        },
        {
          nombre: { contains: search, mode: "insensitive" },
        },
      ],
    };
  } else {
    // SIN BÚSQUEDA: Solo ciudades de la organización y activas
    where = {
      OR: [
        // Ciudades creadas por MI organización
        { organizationId },
        // Ciudades que MI organización ha activado (tienen relaciones)
        {
          ActivatedOrganizationCiudad: {
            some: {
              organizationId,
            },
          },
        },
      ],
    };
  }

  // Ejecutar ambas consultas (obtener datos y contar total) en una transacción
  const [ciudades, total] = await prisma.$transaction([
    prisma.ciudad.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nombre: "asc" },
      include: {
        estado: {
          include: {
            pais: true,
          },
        },
      },
    }),
    prisma.ciudad.count({ where }),
  ]);

  return { ciudades, total };
};

/**
 * Verifica si una ciudad tiene relaciones activas para una organización.
 * Si no tiene ninguna, elimina el enlace de la tabla OrganizacionCiudad.
 * @param ciudadId - El ID de la ciudad a verificar.
 * @param organizationId - El ID de la organización.
 */
export const verificarYDesactivarCiudad = async (
  ciudadId: number,
  organizationId: string,
) => {
  // Contamos las relaciones activas en todas las tablas relevantes
  const [proveedoresCount, clientesCount, pedidosCount, movkarCount] =
    await prisma.$transaction([
      prisma.mproved.count({
        where: { MPCiudadId: ciudadId, MPOrganizationId: organizationId },
      }),
      prisma.cltemae.count({
        where: { CCiudadId: ciudadId, COrganizationId: organizationId },
      }),
      prisma.pclteg.count({
        where: { PGCiudadId: ciudadId, PGOrganizationId: organizationId },
      }),
      // prisma.mOVKAR.count({ where: { ciudadId, organizationId } }),
      prisma.proved.count({
        where: { PCiudadId: ciudadId, POrganizationId: organizationId },
      }),
      // Añade aquí cualquier otra tabla que tenga relación con Ciudad
    ]);

  const totalRelaciones =
    proveedoresCount + clientesCount + pedidosCount + movkarCount;

  // Si no quedan relaciones, eliminamos el enlace de "ciudad activa"
  if (totalRelaciones === 0) {
    await prisma.organizationCiudad
      .delete({
        where: {
          organizationId_ciudadId: {
            organizationId,
            ciudadId,
          },
        },
        // Usamos un `catch` para ignorar el error si el registro ya no existe
      })
      .catch(() => {});
  }
};
