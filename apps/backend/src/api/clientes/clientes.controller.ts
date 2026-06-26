import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./clientes.service.js";
import {
  ActualizarClienteDto,
  CrearClienteDto,
  ListClientesQuery,
} from "./clientes.validator.js";

/**
 * Handler para listar clientes con paginación y búsqueda
 */
export const listClientesHandler = async (
  req: Request<{}, {}, ListClientesQuery>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as { page?: string; search?: string };
  const limit = 10;

  const { clientes, total } = await service.listClientes({
    page: Number(page),
    limit: limit,
    search,
    organizationId,
  });

  res.status(200).json({
    data: clientes,
    pagination: {
      page: Number(page),
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler para obtener un cliente por su secuencia
 */
export const getClienteBySecuenciaHandler = async (
  req: Request<{ secuencia: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const cliente = await service.getClienteBySecuencia(
    Number(secuencia),
    organizationId,
  );

  res.status(200).json(cliente);
};

/**
 * Handler para crear un nuevo cliente
 */
export const createClienteHandler = async (
  req: Request<{}, {}, CrearClienteDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const cliente = await service.createCliente(data, organizationId, userEmail);

  res.status(201).json(cliente);
};

/**
 * Handler para actualizar un cliente existente
 */
export const updateClienteHandler = async (
  req: Request<{ id: string }, {}, ActualizarClienteDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const cliente = await service.updateCliente(Number(id), data, organizationId);

  res.status(200).json(cliente);
};

/**
 * Handler para eliminar un cliente
 */
export const deleteClienteHandler = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteCliente(Number(id), organizationId);

  res.status(204).send();
};
