import type { Request, Response } from "express";
import * as service from "./kardex.service.js";
import { getContext } from "../../middleware/context.middleware.js";

export const listKardexHandler = async (req: Request, res: Response) => {
  const { organizationId, mes, ano } = getContext(req);

  const { page = 1, search, almacenId, productoId } = req.query;
  const limit = 10;

  const { kardex, total } = await service.listKardex({
    page: Number(page),
    limit: Number(limit),
    search: (search as string) || undefined,
    almacenId: almacenId ? Number(almacenId) : undefined,
    productoId: productoId ? Number(productoId) : undefined,
    organizationId,
    mes,
    ano,
  });

  res.status(200).json({
    data: kardex,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getKardexBySecuenciaHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const kardex = await service.getKardexBySecuencia(
    organizationId,
    Number(secuencia),
  );

  if (!kardex) return res.status(404).json({ message: "Kardex not found." });
  res.status(200).json(kardex);
};

export const updateKardexSettingsHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const updated = await service.updateKardexSettings(
    Number(req.params.id),
    req.body,
    organizationId,
  );
  res.status(200).json(updated);
};

export const listKardexLotesHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const { page = 1, search } = req.query;
  const limit = 10;

  const { kardexLotes, total } = await service.listKardexLotes(Number(id), {
    page: Number(page),
    limit: Number(limit),
    search: (search as string) || undefined,
    organizationId,
  });

  res.status(200).json({
    data: kardexLotes,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getLotesDisponiblesHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId, mes, ano } = getContext(req);
  const { productoId, almacenId } = req.query;

  const { lotes } = await service.getLotesDisponiblesByProductoAlmacen({
    productoId: Number(productoId),
    almacenId: Number(almacenId),
    organizationId,
    mes,
    ano,
  });

  res.status(200).json({
    data: lotes,
  });
};
