import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./catalogo.service.js";
import {
  ActualizarProductoDto,
  CrearProductoDto,
  listProductosSchema,
} from "./catalogo.validator.js";

export const listProductosHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);
  const q = listProductosSchema.parse(req.query);
  const {
    page,
    search,
    grupoId,
    grupoNro,
    paisId,
    unidadMedidaId,
    excludeGrupoNro,
  } = q;
  const limit = 10;

  const { productos, total } = await service.listProductos({
    page,
    limit: limit,
    search: search,
    grupoId,
    grupoNro,
    paisId,
    unidadMedidaId,
    excludeGrupoNro,
    organizationId: organizationId,
  });

  res.status(200).json({
    data: productos,
    pagination: {
      page,
      limit: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getProductoHandler = async (
  req: Request<{ secuencia: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const producto = await service.getProductoBySecuencia(
    organizationId,
    Number(secuencia),
  );

  if (!producto) {
    return res.status(404).json({ message: "Product not found." });
  }
  res.status(200).json(producto);
};

export const createProductoHandler = async (
  req: Request<{}, {}, CrearProductoDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);

  const data = req.body;

  const producto = await service.createProducto(
    data,
    organizationId,
    userEmail,
  );
  res.status(201).json(producto);
};

export const updateProductoHandler = async (
  req: Request<{ id: string }, {}, ActualizarProductoDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const producto = await service.updateProducto(
    Number(id),
    data,
    organizationId,
  );
  res.status(200).json(producto);
};

export const deleteProductoHandler = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteProducto(Number(id), organizationId);
  res.status(204).send();
};
