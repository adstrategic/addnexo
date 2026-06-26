import { EstadoReserva, prisma, type Prisma } from "@repo/db";

import type {
  CreateReservationDto,
  ListReservationsQuery,
  ReleaseReservationDto,
} from "./reservations.validator.js";

// Helper function to get or create reservation config
async function getOrCreateReservationConfig(
  organizationId: string,
  tx: Prisma.TransactionClient,
) {
  let config = await tx.reservationConfig.findUnique({
    where: { RCOrganizationId: organizationId },
  });

  config ??= await tx.reservationConfig.create({
    data: {
      RCOrganizationId: organizationId,
      RCDiasExpiracion: 3,
      RCNotificarAntes: 1,
      RCAutoLiberarExpiradas: true,
      usuario: "system",
    },
  });

  return config;
}

// Get reserved quantity for a specific KardexLote
export async function getReservedQuantityByLote(
  kardexLoteId: number,
  organizationId: string,
  tx: Prisma.TransactionClient,
  excludeDispatchOrderGId?: number,
  excludeDispatchOrderUId?: number,
) {
  const where: Prisma.InventoryReservationWhereInput = {
    IRKardexLoteId: kardexLoteId,
    IROrganizationId: organizationId,
    IREstado: "ACTIVE",
  };

  // Collect all DispatchOrderU IDs to exclude
  const excludeDispatchOrderUIds: number[] = [];

  // If excludeDispatchOrderGId is provided, get all DispatchOrderU items from that dispatch order
  // This is used when emitting a dispatch order to exclude its own reservations
  // from stock availability calculation
  if (excludeDispatchOrderGId) {
    const dispatchOrderItems = await tx.dispatchOrderU.findMany({
      where: {
        DOUDispatchOrderGId: excludeDispatchOrderGId,
        DOUOrganizationId: organizationId,
      },
      select: { DOUId: true },
    });

    const dispatchOrderUIds = dispatchOrderItems.map((item) => item.DOUId);
    excludeDispatchOrderUIds.push(...dispatchOrderUIds);
  }

  // If excludeDispatchOrderUId is provided, exclude that single item's reservation
  // Used when updating an item so "available" does not count this item's own reservation
  if (
    excludeDispatchOrderUId != null &&
    !excludeDispatchOrderUIds.includes(excludeDispatchOrderUId)
  ) {
    excludeDispatchOrderUIds.push(excludeDispatchOrderUId);
  }

  // Apply exclusion filter if we have any IDs to exclude
  if (excludeDispatchOrderUIds.length > 0) {
    if (excludeDispatchOrderUIds.length === 1) {
      where.IRDispatchOrderUId = { not: excludeDispatchOrderUIds[0] };
    } else {
      where.IRDispatchOrderUId = { notIn: excludeDispatchOrderUIds };
    }
  }

  const reservations = await tx.inventoryReservation.findMany({
    where,
    select: { IRCantidadReservada: true },
  });

  return reservations.reduce((sum, r) => sum + r.IRCantidadReservada, 0);
}

// Create a new reservation
export async function createReservation(
  data: CreateReservationDto,
  organizationId: string,
  usuario: string,
) {
  return prisma.$transaction(async (innerTx) => {
    // 1. Get or create reservation config
    const config = await getOrCreateReservationConfig(organizationId, innerTx);

    // 2. Validate that dispatch order item exists and is in DRAFT state
    const dispatchOrderU = await innerTx.dispatchOrderU.findUnique({
      where: { DOUId: data.dispatchOrderUId },
      include: {
        dispatchOrderG: true,
      },
    });

    if (!dispatchOrderU) {
      throw new Error("Dispatch order item not found");
    }

    if (dispatchOrderU.dispatchOrderG.DOGEstado !== "DRAFT") {
      throw new Error(
        "Can only create reservations for items in DRAFT dispatch orders",
      );
    }

    if (dispatchOrderU.DOUOrganizationId !== organizationId) {
      throw new Error(
        "Dispatch order item does not belong to this organization",
      );
    }

    // 3. Validate that kardex lote exists and belongs to the product
    const kardexLote = await innerTx.kardexLote.findUnique({
      where: { KLId: data.kardexLoteId },
    });

    if (!kardexLote) {
      throw new Error("Kardex lote not found");
    }

    if (
      kardexLote.KLOrganizationId !== organizationId ||
      kardexLote.KLInvcaruniId !== data.invcaruniId
    ) {
      throw new Error("Kardex lote does not match product or organization");
    }

    // 4. Check available stock (existence - reserved)
    const reservedQty = await getReservedQuantityByLote(
      data.kardexLoteId,
      organizationId,
      innerTx,
      data.dispatchOrderUId,
    );

    const existenciaDisponible =
      Number(kardexLote.KLExistenciaFin) - reservedQty;

    if (data.cantidad > existenciaDisponible) {
      throw new Error(
        `Insufficient available stock. Available: ${existenciaDisponible}, Requested: ${data.cantidad}`,
      );
    }

    // 5. Get next sequence number
    const ultimoSecuencial = await innerTx.inventoryReservation.findFirst({
      where: { IROrganizationId: organizationId },
      orderBy: { IROrgSecuencia: "desc" },
    });
    const siguienteSecuencial = (ultimoSecuencial?.IROrgSecuencia ?? 0) + 1;

    // 6. Calculate expiration date
    const fechaReserva = new Date();
    const fechaExpiracion = new Date(fechaReserva);
    fechaExpiracion.setDate(
      fechaExpiracion.getDate() + config.RCDiasExpiracion,
    );

    // 7. Create reservation
    const reservation = await innerTx.inventoryReservation.create({
      data: {
        IROrganizationId: organizationId,
        IRDispatchOrderUId: data.dispatchOrderUId,
        IRInvcaruniId: data.invcaruniId,
        IRKardexLoteId: data.kardexLoteId,
        IRCantidadReservada: data.cantidad,
        IRFechaReserva: fechaReserva,
        IRFechaExpiracion: fechaExpiracion,
        IREstado: EstadoReserva.ACTIVE,
        IROrgSecuencia: siguienteSecuencial,
        usuario,
      },
      include: {
        dispatchOrderU: {
          include: {
            invcaruni: true,
          },
        },
        invcaruni: true,
        kardexLote: {
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
      },
    });

    // 8. Update DOUReservado flag
    await innerTx.dispatchOrderU.update({
      where: { DOUId: data.dispatchOrderUId },
      data: { DOUReservado: true },
    });

    return reservation;
  });
}

// List reservations with filters
export async function listReservations(options: {
  page: number;
  limit: number;
  search?: string;
  estado?: EstadoReserva;
  productId?: number;
  dispatchOrderUId?: number;
  dispatchOrderId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  organizationId: string;
}) {
  const {
    page,
    limit,
    search,
    estado,
    productId,
    dispatchOrderUId,
    dispatchOrderId,
    dateFrom,
    dateTo,
    organizationId,
  } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.InventoryReservationWhereInput = {
    IROrganizationId: organizationId,
  };

  if (estado) {
    where.IREstado = estado as EstadoReserva;
  }

  if (productId) {
    where.IRInvcaruniId = productId;
  }

  if (dispatchOrderUId) {
    where.IRDispatchOrderUId = dispatchOrderUId;
  }

  if (dispatchOrderId) {
    where.dispatchOrderU = {
      DOUDispatchOrderGId: dispatchOrderId,
    };
  }

  if (dateFrom || dateTo) {
    where.IRFechaReserva = {};
    if (dateFrom) {
      where.IRFechaReserva.gte = dateFrom;
    }
    if (dateTo) {
      where.IRFechaReserva.lte = dateTo;
    }
  }

  if (search) {
    where.OR = [
      {
        invcaruni: { CKDescripcion: { contains: search, mode: "insensitive" } },
      },
      { kardexLote: { KLLote: { contains: search, mode: "insensitive" } } },
      {
        dispatchOrderU: {
          dispatchOrderG: {
            cltemae: {
              CNombreCliente: { contains: search, mode: "insensitive" },
            },
          },
        },
      },
    ];
  }

  const [reservations, total] = await prisma.$transaction([
    prisma.inventoryReservation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { IRFechaReserva: "desc" },
      include: {
        dispatchOrderU: {
          include: {
            dispatchOrderG: {
              include: {
                cltemae: true,
              },
            },
            invcaruni: true,
          },
        },
        invcaruni: true,
        kardexLote: {
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
      },
    }),
    prisma.inventoryReservation.count({ where }),
  ]);

  return { reservations, total };
}

// Get reservation by ID
export async function getReservationById(id: number, organizationId: string) {
  return prisma.inventoryReservation.findFirst({
    where: {
      IRId: id,
      IROrganizationId: organizationId,
    },
    include: {
      dispatchOrderU: {
        include: {
          dispatchOrderG: {
            include: {
              cltemae: true,
            },
          },
          invcaruni: true,
        },
      },
      invcaruni: true,
      kardexLote: {
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
    },
  });
}

// Release a reservation manually
export async function releaseReservation(
  id: number,
  data: ReleaseReservationDto,
  organizationId: string,
) {
  return prisma.$transaction(async (innerTx) => {
    const reservation = await innerTx.inventoryReservation.findFirst({
      where: {
        IRId: id,
        IROrganizationId: organizationId,
        IREstado: EstadoReserva.ACTIVE,
      },
    });

    if (!reservation) {
      throw new Error("Active reservation not found");
    }

    // Update reservation status
    const updated = await innerTx.inventoryReservation.update({
      where: { IRId: id },
      data: {
        IREstado: EstadoReserva.RELEASED,
        IRFechaLiberacion: new Date(),
        IRMotivo: data.motivo ?? "Manual release",
      },
      include: {
        dispatchOrderU: true,
      },
    });

    // Check if there are other active reservations for this item
    const otherActiveReservations = await innerTx.inventoryReservation.count({
      where: {
        IRDispatchOrderUId: reservation.IRDispatchOrderUId,
        IREstado: EstadoReserva.ACTIVE,
      },
    });

    // Update DOUReservado flag only if no other active reservations
    if (otherActiveReservations === 0) {
      await innerTx.dispatchOrderU.update({
        where: { DOUId: reservation.IRDispatchOrderUId },
        data: { DOUReservado: false },
      });
    }

    return updated;
  });
}

// Consume reservations for a dispatch order (called when emitting)
export async function consumeReservationsForDispatchOrder(
  dispatchOrderId: number,
  organizationId: string,
  tx: Prisma.TransactionClient,
) {
  // Find all active reservations for items in this dispatch order
  const reservations = await tx.inventoryReservation.findMany({
    where: {
      IROrganizationId: organizationId,
      IREstado: EstadoReserva.ACTIVE,
      dispatchOrderU: {
        DOUDispatchOrderGId: dispatchOrderId,
      },
    },
  });

  // Mark all as consumed
  for (const reservation of reservations) {
    await tx.inventoryReservation.update({
      where: { IRId: reservation.IRId },
      data: {
        IREstado: EstadoReserva.CONSUMED,
        IRFechaLiberacion: new Date(),
        IRMotivo: "Consumida al emitir dispatch order",
      },
    });

    // Update DOUReservado flag
    await tx.dispatchOrderU.update({
      where: { DOUId: reservation.IRDispatchOrderUId },
      data: { DOUReservado: false },
    });
  }

  return reservations.length;
}

// Release expired reservations (for cron job)
export async function releaseExpiredReservations(
  tx?: Prisma.TransactionClient,
) {
  const client = tx || prisma;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredReservations = await client.inventoryReservation.findMany({
    where: {
      IREstado: EstadoReserva.ACTIVE,
      IRFechaExpiracion: { lte: today },
    },
    include: {
      dispatchOrderU: true,
    },
  });

  let count = 0;

  for (const reservation of expiredReservations) {
    await client.inventoryReservation.update({
      where: { IRId: reservation.IRId },
      data: {
        IREstado: EstadoReserva.EXPIRED,
        IRFechaLiberacion: new Date(),
        IRMotivo: "Automatic expiration by time",
      },
    });

    // Check if there are other active reservations for this item
    const otherActiveReservations = await client.inventoryReservation.count({
      where: {
        IRDispatchOrderUId: reservation.IRDispatchOrderUId,
        IREstado: EstadoReserva.ACTIVE,
      },
    });

    // Update DOUReservado flag only if no other active reservations
    if (otherActiveReservations === 0) {
      await client.dispatchOrderU.update({
        where: { DOUId: reservation.IRDispatchOrderUId },
        data: { DOUReservado: false },
      });
    }

    count++;
  }

  return count;
}
