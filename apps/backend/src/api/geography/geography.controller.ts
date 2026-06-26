import type { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./geography.service.js";
import { CiudadDto, EstadoDto, PaisDto } from "./geography.validator.js";

// --- Handlers de Países ---
export const createPaisHandler = async (
  req: Request<{}, {}, PaisDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const data = req.body;

  const pais = await service.createPais(data, organizationId);
  res.status(201).json(pais);
};
// handlers para update y delete de países:
export const updatePaisHandler = async (
  req: Request<{ id: string }, {}, PaisDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const data = req.body;

  const pais = await service.updatePais(
    Number(req.params.id),
    data,
    organizationId,
  );

  res.status(200).json(pais);
};

// --- Handlers de Estados ---
export const createEstadoHandler = async (
  req: Request<{}, {}, EstadoDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const estado = await service.createEstado(
    req.body,
    // parseInt(req.params.paisId),
    organizationId,
  );
  res.status(201).json(estado);
};
// ... (handlers para update y delete de estados)

// --- Handlers de Ciudades ---
export const createCiudadHandler = async (
  req: Request<{}, {}, CiudadDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const data = req.body;

  const ciudad = await service.createCiudad(
    data,
    //  parseInt(req.params.estadoId),
    organizationId,
  );
  res.status(201).json(ciudad);
};
// ... (handlers para update y delete de ciudades)

// --- Handler de Búsqueda ---
export const searchCiudadesHandler = async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || String(q).length < 2) return res.json([]);
  const ciudades = await service.searchCiudades(
    String(q),
    (req as any).organizationId,
  );
  res.json(
    ciudades.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      estado: c.estado.nombre,
      pais: c.estado.pais.nombre,
      label: `${c.nombre}, ${c.estado.nombre}, ${c.estado.pais.nombre}`,
    })),
  );
};

// --- Handler de Búsqueda de Estados ---
export const searchPaisesHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);
  const { q } = req.query;
  const query = q ? String(q) : "";

  const paises = await service.searchPaises(query, organizationId);
  res.json(paises);
};
// --- Handler de Búsqueda de Estados ---
export const searchEstadosHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);
  const { q } = req.query;
  const query = q ? String(q) : "";
  const estados = await service.searchEstados(query, organizationId);
  res.json(
    estados.map((estado) => ({
      id: estado.id,
      nombre: estado.nombre,
      pais: estado.pais,
      label: `${estado.nombre}, ${estado.pais.nombre}`,
    })),
  );
};

// --- Handler de Listado de Ciudades con Relaciones ---
export const listCiudadesConRelacionesHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page = 1, limit = 10, search } = req.query;

  const { ciudades, total } = await service.listCiudadesConRelaciones({
    page: Number(page),
    limit: Number(limit),
    search: search as string | undefined,
    organizationId,
  });

  res.status(200).json({
    data: ciudades.map((ciudad) => ({
      id: ciudad.id,
      nombre: ciudad.nombre,
      estado: {
        id: ciudad.estado.id,
        nombre: ciudad.estado.nombre,
        pais: {
          id: ciudad.estado.pais.id,
          nombre: ciudad.estado.pais.nombre,
        },
      },
      fromOrganization: ciudad.organizationId ? true : false,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalItems: total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};
