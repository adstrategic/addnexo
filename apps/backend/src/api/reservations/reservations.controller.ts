import type { Request, Response } from "express";

import { EstadoReserva, prisma } from "@repo/db";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./reservations.service.js";
import {
  CreateReservationDto,
  ReleaseReservationDto,
} from "./reservations.validator.js";

/**
 * Handler para listar reservas
 */
export const listReservationsHandler = async (
  req: Request<
    {},
    {},
    {},
    {
      dateFrom?: string;
      dateTo?: string;
      dispatchOrderId?: string;
      dispatchOrderUId?: string;
      estado?: EstadoReserva;
      page?: string;
      productId?: string;
      search?: string;
    }
  >,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const {
    page,
    search,
    estado,
    dispatchOrderId,
    dispatchOrderUId,
    dateFrom,
    dateTo,
    productId,
  } = req.query;
  const limit = 10;

  const { reservations, total } = await service.listReservations({
    page: Number(page),
    limit,
    search,
    estado,
    dispatchOrderId: dispatchOrderId ? Number(dispatchOrderId) : undefined,
    dispatchOrderUId: dispatchOrderUId ? Number(dispatchOrderUId) : undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    productId: productId ? Number(productId) : undefined,
    organizationId,
  });

  res.status(200).json({
    data: reservations,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler para crear una nueva reserva
 */
export const createReservationHandler = async (
  req: Request<{}, {}, CreateReservationDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const reservation = await service.createReservation(
    data,
    organizationId,
    userEmail,
  );

  res.status(201).json({
    data: reservation,
    message: "Reservation created successfully",
  });
};

/**
 * Handler para obtener una reserva por ID
 */
export const getReservationByIdHandler = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  const reservation = await service.getReservationById(
    Number(id),
    organizationId,
  );

  if (!reservation) {
    return res.status(404).json({ message: "Reservation not found" });
  }

  res.status(200).json({ data: reservation });
};

/**
 * Handler para liberar una reserva manualmente
 */
export const releaseReservationHandler = async (
  req: Request<{ id: string }, {}, ReleaseReservationDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const reservation = await service.releaseReservation(
    Number(id),
    data,
    organizationId,
  );

  res.status(200).json({
    data: reservation,
    message: "Reservation released successfully",
  });
};

/**
 * Handler para obtener cantidad reservada por lote
 */
export const getReservedQuantityByLoteHandler = async (
  req: Request<{ kardexLoteId: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { kardexLoteId } = req.params;

  const reservedQty = await prisma.$transaction(async (tx) => {
    return service.getReservedQuantityByLote(
      Number(kardexLoteId),
      organizationId,
      tx,
    );
  });

  res.status(200).json({
    data: {
      kardexLoteId,
      cantidadReservada: reservedQty,
    },
  });
};
