import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./proveedores.service.js";
import {
  ActualizarProveedorDto,
  CrearProveedorDto,
} from "./proveedores.validator.js";

export const listProveedoresHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as {
    page?: string;
    search?: string;
  };
  const limit = 10;

  const { proveedores, total } = await service.listProveedores({
    page: Number(page),
    limit,
    search,
    organizationId,
  });

  res.status(200).json({
    data: proveedores,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getProveedorBySecuenciaHandler = async (
  req: Request<{ secuencia: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const proveedor = await service.getProveedorBySecuencia(
    Number(secuencia),
    organizationId,
  );
  if (!proveedor) {
    return res.status(404).json({ message: "Supplier not found" });
  }
  res.status(200).json(proveedor);
};

export const createProveedorHandler = async (
  req: Request<{}, {}, CrearProveedorDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const nuevoProveedor = await service.createProveedor(
    data,
    organizationId,
    userEmail,
  );
  res.status(201).json(nuevoProveedor);
};

export const updateProveedorHandler = async (
  req: Request<{ id: string }, {}, ActualizarProveedorDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const proveedorActualizado = await service.updateProveedor(
    Number(id),
    data,
    organizationId,
  );
  res.status(200).json(proveedorActualizado);
};

export const deleteProveedorHandler = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteProveedor(Number(id), organizationId);
  res.status(204).send();
};
