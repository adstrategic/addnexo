import type { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./unidades.service.js";
import {
  ActualizarUnidadMedidaDto,
  UnidadMedidaDto,
} from "./unidades.validator.js";

export const listUnidadesHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as { page?: string; search: string };
  const limit = 10;

  const { total, unidades } = await service.listUnidades({
    limit,
    organizationId,
    page: Number(page),
    search,
  });

  res.status(200).json({
    data: unidades,
    pagination: {
      limit: limit,
      page: Number(page),
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getUnidadBySecuenciaHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const unidad = await service.getUnidadBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!unidad) return res.status(404).json({ message: "Unit not found." });
  res.status(200).json(unidad);
};

export const createUnidadHandler = async (
  req: Request<{}, {}, UnidadMedidaDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);

  const data = req.body;
  const unidad = await service.createUnidad(data, organizationId, userEmail);
  res.status(201).json(unidad);
};

export const updateUnidadHandler = async (
  req: Request<{ id: string }, {}, ActualizarUnidadMedidaDto>,
  res: Response,
) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Unidad ID is required." });

  const data = req.body;

  const unidad = await service.updateUnidad(Number(id), data);
  res.status(200).json(unidad);
};

export const deleteUnidadHandler = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Unidad ID is required." });

  await service.deleteUnidad(Number(id));
  res.status(204).send();
};

// export const getProductosByUnidadHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   const { organizationId, userEmail } = getContext(req);

//   const { page = 1, search } = req.query;
//   const limit = 10;
//   const idParam = req.params.id;
//   const unidadMedidaId =
//     typeof idParam === "string" ? parseInt(idParam, 10) : NaN;

//   const { productos, total } = await listProductos({
//     limit: Number(limit),
//     organizationId,
//     page: Number(page),
//     search: search as string | undefined,
//     unidadMedidaId,
//   });

//   res.status(200).json({
//     data: productos,
//     pagination: {
//       page: Number(page),
//       limit: Number(limit),
//       totalItems: total,
//       totalPages: Math.ceil(total / Number(limit)),
//     },
//   });
// };
