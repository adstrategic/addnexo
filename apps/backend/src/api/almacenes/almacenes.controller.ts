import type { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./almacenes.service.js";
import { ActualizarAlmacenDto, AlmacenDto } from "./almacenes.validator.js";

export const listAlmacenesHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as { page?: string; search: string };
  const limit = 10;

  const { almacenes, total } = await service.listAlmacenes({
    limit,
    organizationId,
    page: Number(page),
    search,
  });

  res.status(200).json({
    data: almacenes,
    pagination: {
      limit: limit,
      page: Number(page),
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getAlmacenBySecuenciaHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const almacen = await service.getAlmacenBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!almacen)
    return res.status(404).json({ message: "Warehouse not found." });
  res.status(200).json(almacen);
};

export const createAlmacenHandler = async (
  req: Request<{}, {}, AlmacenDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);

  const data = req.body;
  const almacen = await service.createAlmacen(data, organizationId, userEmail);
  res.status(201).json(almacen);
};

export const updateAlmacenHandler = async (
  req: Request<{ id: string }, {}, ActualizarAlmacenDto>,
  res: Response,
) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Almacén ID is required." });

  const data = req.body;

  const almacen = await service.updateAlmacen(Number(id), data);
  res.status(200).json(almacen);
};

export const deleteAlmacenHandler = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Almacén ID is required." });

  await service.deleteAlmacen(Number(id));
  res.status(204).send();
};
