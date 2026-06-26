import { type Prisma, prisma } from "@repo/db";
import type {
  ListKardexDto,
  UpdateKardexSettingsDto,
  ListKardexLotesDto,
  GetLotesDisponiblesDto,
} from "./kardex.validator.js";

export const listKardex = async (
  params: ListKardexDto & { organizationId: string; mes: number; ano: number },
) => {
  const {
    page = 1,
    limit = 10,
    search,
    almacenId,
    productoId,
    organizationId,
    mes,
    ano,
  } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.KardexWhereInput = {
    KOrganizationId: organizationId,
    KMes: mes,
    KAno: ano,
  };
  if (almacenId) where.KAlmacenId = almacenId;
  if (productoId) where.KInvcaruniId = productoId;

  // TODO: revisar si se debe usar el campo de búsqueda de la tabla invcaruni o el de la tabla kardex
  if (search) {
    // where.invcaruni = {
    //   CKDescripcion: { contains: search, mode: "insensitive" },
    // };
    where.OR = [
      // ...(isNumber ? [{ GNro: searchNumber }] : []),
      {
        KUltimoDetalle: { contains: search, mode: "insensitive" },
        // KUltimoDetalle: { contains: search, mode: "insensitive" },
      },
      {
        invcaruni: {
          CKDescripcion: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.kardex.findMany({
      where,
      include: {
        invcaruni: { include: { grupo: true, unidadDeMedida: true } },
        almacen: true,
      },
      orderBy: { KInvcaruniId: "asc" },
      skip,
      take: limit,
    }),
    prisma.kardex.count({ where }),
  ]);

  return { kardex: items, total };
};

export const getKardexBySecuencia = async (
  organizationId: string,
  sequence: number,
) => {
  return prisma.kardex.findUnique({
    where: {
      kardex_sequence: {
        KOrganizationId: organizationId,
        KOrgSecuencia: sequence,
      },
    },
    include: {
      invcaruni: { include: { grupo: true, unidadDeMedida: true } },
      almacen: {
        include: {
          ciudad: { include: { estado: { include: { pais: true } } } },
        },
      },
    },
  });
};

export const updateKardexSettings = async (
  id: number,
  data: UpdateKardexSettingsDto,
  organizationId: string,
) => {
  const actual = await prisma.kardex.findUnique({ where: { KId: id } });
  if (!actual || actual.KOrganizationId !== organizationId) {
    throw new Error("Kardex not found or does not belong to the organization.");
  }

  return prisma.kardex.update({
    where: { KId: id },
    data: { ...data },
  });
};

export const listKardexLotes = async (
  kardexId: number,
  params: ListKardexLotesDto & { organizationId: string },
) => {
  const { page = 1, limit = 10, search, organizationId } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.KardexLoteWhereInput = {
    KLKardexId: kardexId,
    KLOrganizationId: organizationId,
  };

  if (search) {
    where.OR = [
      {
        ciudad: {
          nombre: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.kardexLote.findMany({
      where,
      include: {
        invcaruni: { include: { grupo: true, unidadDeMedida: true } },
        ciudad: { include: { estado: { include: { pais: true } } } },
      },
      orderBy: { KLFechaUltimaEntrada: "desc" },
      skip,
      take: limit,
    }),
    prisma.kardexLote.count({ where }),
  ]);

  return { kardexLotes: items, total };
};

export const getLotesDisponiblesByProductoAlmacen = async (
  params: GetLotesDisponiblesDto & {
    organizationId: string;
    mes: number;
    ano: number;
  },
) => {
  const { productoId, almacenId, organizationId, mes, ano } = params;

  // Primero buscar el kardex padre para este producto, almacén y período activo
  const kardex = await prisma.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: productoId,
      KAlmacenId: almacenId,
      KMes: mes,
      KAno: ano,
    },
    select: {
      KId: true,
    },
  });

  if (!kardex) {
    return { lotes: [] };
  }

  // Buscar lotes del período activo con inventario disponible
  const where: Prisma.KardexLoteWhereInput = {
    KLKardexId: kardex.KId,
    KLOrganizationId: organizationId,
    KLMes: mes,
    KLAno: ano,
    KLExistenciaFin: {
      gt: 0, // Solo lotes con inventario disponible
    },
  };

  const lotes = await prisma.kardexLote.findMany({
    where,
    select: {
      KLId: true,
      KLLote: true,
      KLNroDocumento: true, // Include document number
      KLExistenciaFin: true,
      KLCostoPromedio: true,
      KLFechaUltimaEntrada: true,
      ciudad: {
        select: {
          id: true,
          nombre: true,
        },
      },
      // Include active reservations to calculate available quantity
      inventoryReservations: {
        where: {
          IREstado: "ACTIVE",
        },
        select: {
          IRCantidadReservada: true,
        },
      },
    },
    orderBy: {
      KLFechaUltimaEntrada: "asc", // FIFO: más antiguo primero
    },
  });

  // Calculate available quantity = existencia - reserved
  const lotesConDisponibilidad = lotes.map((lote) => {
    const cantidadReservada = lote.inventoryReservations.reduce(
      (sum, r) => sum + Number(r.IRCantidadReservada),
      0,
    );
    const cantidadDisponible = Number(lote.KLExistenciaFin) - cantidadReservada;

    // Remove inventoryReservations from response
    const { inventoryReservations, ...loteSinReservas } = lote;

    return {
      ...loteSinReservas,
      // Override KLExistenciaFin with available quantity (after subtracting reservations)
      // This ensures the frontend sees the correct available quantity without changes
      KLExistenciaFin: cantidadDisponible,
      cantidadReservada,
      cantidadDisponible,
    };
  });

  // Only return lotes with available stock (cantidadDisponible > 0)
  return {
    lotes: lotesConDisponibilidad.filter((lote) => lote.cantidadDisponible > 0),
  };
};
