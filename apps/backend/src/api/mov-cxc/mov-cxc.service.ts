import {
  EstadoFactura,
  prisma,
  type Prisma,
  type TipoPropositoMovkar,
} from "@repo/db";
import { EntityNotFoundError } from "../../errors/EntityErrors.js";

interface ListMovCXCOptions {
  page: number;
  limit: number;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  estado?: EstadoFactura;
  organizationId: string;
  tipoProposito: TipoPropositoMovkar[];
}

/**
 * Lista movimientos CXC (credit notes o debit notes) con paginación y filtros
 */
export const listMovCXC = async (options: ListMovCXCOptions) => {
  const {
    page,
    limit,
    search,
    dateFrom,
    dateTo,
    estado,
    organizationId,
    tipoProposito,
  } = options;

  const skip = (page - 1) * limit;

  // Primero, obtener los tipos de movimiento que corresponden al propósito
  const tiposMovimiento = await prisma.tmovkar.findMany({
    where: {
      TOrganizationId: organizationId,
      TProposito: {
        in: tipoProposito,
      },
    },
    select: {
      TId: true,
    },
  });

  const tipoMovimientoIds = tiposMovimiento.map((t) => t.TId);

  if (tipoMovimientoIds.length === 0) {
    return { movimientos: [], total: 0 };
  }

  const where: Prisma.MovCXCWhereInput = {
    MCOrganizationId: organizationId,
    MCTipoMovimientoId: {
      in: tipoMovimientoIds,
    },
  };

  if (estado) {
    where.facturag = { FGEstado: estado };
  }

  // Filtro de búsqueda
  if (search) {
    const searchNumber = parseInt(search);
    const isNumber = !isNaN(searchNumber);
    where.OR = [
      { MCNroDocumento: { contains: search, mode: "insensitive" } },
      { MCDescripcion: { contains: search, mode: "insensitive" } },
      ...(isNumber ? [{ MCNro: searchNumber }] : []),
      {
        facturag: {
          OR: [
            { FGNro: searchNumber },
            {
              cltemae: {
                OR: [
                  { CRazonSocial: { contains: search, mode: "insensitive" } },
                  { CNitCedula: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ],
        },
      },
    ];
  }

  // Filtro de fechas
  if (dateFrom || dateTo) {
    where.MCFecha = {};
    if (dateFrom) {
      where.MCFecha.gte = dateFrom;
    }
    if (dateTo) {
      where.MCFecha.lte = dateTo;
    }
  }

  const [movimientos, total] = await prisma.$transaction([
    prisma.movCXC.findMany({
      where,
      skip,
      take: limit,
      orderBy: { creadoOModificado: "desc" },
      include: {
        tipoMovimiento: {
          select: {
            TId: true,
            TProposito: true,
            TDescripcion: true,
          },
        },
        facturag: {
          include: {
            cltemae: true,
            vendedor: true,
          },
        },
        walletPayment: { include: { bank: true } },
        creditCardPayment: { include: { bank: true } },
        transferPayment: { include: { bank: true } },
        checkPayment: { include: { bank: true } },
      },
    }),
    prisma.movCXC.count({ where }),
  ]);

  return { movimientos, total };
};

/**
 * Obtiene un movimiento CXC por su secuencia en la factura
 */
export const getMovCXCBySecuencia = async (
  secuencia: number,
  organizationId: string,
  tipoProposito: TipoPropositoMovkar[],
) => {
  // Primero, obtener los tipos de movimiento que corresponden al propósito
  const tiposMovimiento = await prisma.tmovkar.findMany({
    where: {
      TOrganizationId: organizationId,
      TProposito: {
        in: tipoProposito,
      },
    },
    select: {
      TId: true,
    },
  });

  const tipoMovimientoIds = tiposMovimiento.map((t) => t.TId);

  if (tipoMovimientoIds.length === 0) {
    throw new EntityNotFoundError("Movement type not found");
  }

  // Buscar el movimiento por secuencia
  // La secuencia es única por factura, así que necesitamos buscar en todas las facturas
  // y luego filtrar por secuencia
  const movimientos = await prisma.movCXC.findMany({
    where: {
      MCOrganizationId: organizationId,
      MCTipoMovimientoId: {
        in: tipoMovimientoIds,
      },
      MCSecuencia: secuencia,
    },
    include: {
      tipoMovimiento: {
        select: {
          TId: true,
          TProposito: true,
          TDescripcion: true,
        },
      },
      facturag: {
        include: {
          cltemae: {
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
          },
          vendedor: true,
        },
      },
      walletPayment: { include: { bank: true } },
      creditCardPayment: { include: { bank: true } },
      transferPayment: { include: { bank: true } },
      checkPayment: { include: { bank: true } },
      facturaReturnItems: {
        include: {
          invcaruni: {
            include: {
              grupo: true,
              unidadDeMedida: true,
            },
          },
        },
      },
    },
    orderBy: {
      creadoOModificado: "desc",
    },
  });

  if (movimientos.length === 0) {
    throw new EntityNotFoundError("Credit/Debit note not found");
  }

  // Si hay múltiples, devolver el más reciente
  return movimientos[0];
};
