import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./tmovkar.service.js";
import {
  ActualizarTipoMovimientoDto,
  TipoMovimientoDto,
} from "./tmovkar.validator.js";

// Server-defined page size; the client does not send a limit for now
const TIPOS_MOVIMIENTO_LIMIT = 50;

export const listTiposMovimientoHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as { page?: string; search?: string };
  const limit = TIPOS_MOVIMIENTO_LIMIT;

  const { tipos, total } = await service.listTiposMovimiento({
    page: Number(page),
    limit,
    search,
    organizationId,
  });

  res.status(200).json({
    data: tipos,
    pagination: {
      page: Number(page),
      limit: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getTipoMovimientoBySecuenciaHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const tipo = await service.getTipoMovimientoBySecuencia(
    organizationId,
    Number(secuencia),
  );
  if (!tipo) return res.status(404).json({ message: "Tipo no encontrado." });
  res.status(200).json(tipo);
};

export const createTipoMovimientoHandler = async (
  req: Request<{}, {}, TipoMovimientoDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);

  const data = req.body;

  const created = await service.createTipoMovimiento(
    data,
    organizationId,
    userEmail,
  );
  res.status(201).json(created);
};

export const updateTipoMovimientoHandler = async (
  req: Request<{ id: string }, {}, ActualizarTipoMovimientoDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const updated = await service.updateTipoMovimiento(
    Number(req.params.id),
    req.body,
    organizationId,
  );
  res.status(200).json(updated);
};

export const deleteTipoMovimientoHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  await service.deleteTipoMovimiento(Number(req.params.id), organizationId);
  res.status(204).send();
};

export const getNextAvailableClassHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { tipo } = req.query;

  if (!tipo || (tipo !== "1" && tipo !== "2")) {
    return res.status(400).json({
      message: "Invalid tipo. Must be 1 (Entry) or 2 (Exit).",
    });
  }

  const nextClass = await service.getNextAvailableClass(
    organizationId,
    Number(tipo),
  );
  res.status(200).json({ nextClass });
};

export const getAvailablePurposesHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const excludeTmovkarId = req.query.excludeTmovkarId
    ? Number(req.query.excludeTmovkarId)
    : undefined;

  const availablePurposes = await service.getAvailablePurposes(
    organizationId,
    excludeTmovkarId,
  );
  res.status(200).json({ data: availablePurposes });
};
