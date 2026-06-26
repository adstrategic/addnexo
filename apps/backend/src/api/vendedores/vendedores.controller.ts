import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./vendedores.service.js";
import {
  ActualizarVendedorDto,
  CrearVendedorDto,
} from "./vendedores.validator.js";

/**
 * Handler para listar vendedores con paginación y búsqueda
 */
export const listVendedoresHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as {
    page?: string;
    search?: string;
  };
  const limit = 10;

  const { vendedores, total } = await service.listVendedores({
    page: Number(page),
    limit,
    search,
    organizationId,
  });

  res.status(200).json({
    data: vendedores,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler para obtener un vendedor por su secuencia
 */
export const getVendedorBySecuenciaHandler = async (
  req: Request<{ secuencia: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const vendedor = await service.getVendedorBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!vendedor) {
    return res.status(404).json({ message: "Customer not found." });
  }

  res.status(200).json(vendedor);
};

/**
 * Handler para crear un nuevo vendedor
 */
export const createVendedorHandler = async (
  req: Request<{}, {}, CrearVendedorDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const vendedor = await service.createVendedor(
    data,
    organizationId,
    userEmail,
  );

  res.status(201).json(vendedor);
};

/**
 * Handler para actualizar un vendedor existente
 */
export const updateVendedorHandler = async (
  req: Request<{ id: string }, {}, ActualizarVendedorDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const vendedor = await service.updateVendedor(
    Number(id),
    data,
    organizationId,
  );

  res.status(200).json(vendedor);
};

/**
 * Handler para eliminar un vendedor
 */
export const deleteVendedorHandler = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteVendedor(Number(id), organizationId);

  res.status(204).send();
};
