import { Request, Response } from "express";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./grupos.service.js";
import { ActualizarGrupoDto, CrearGrupoDto } from "./grupos.validator.js";

export const listGruposHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const { page = 1, search } = req.query as { page?: string; search: string };
  const limit = 10;

  const { grupos, total } = await service.listGrupos({
    limit,
    organizationId,
    page: Number(page),
    search,
  });

  res.status(200).json({
    data: grupos,
    pagination: {
      limit,
      page: Number(page),
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const getGrupoBySecuenciaHandler = async (
  req: Request<{ secuencia: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const grupo = await service.getGrupoBySecuencia(
    Number(secuencia),
    organizationId,
  );

  if (!grupo) return res.status(404).json({ message: "Group not found." });
  res.status(200).json(grupo);
};

export const getSiguienteNumeroGrupoHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const siguienteNumero = await service.getSiguienteNumeroGrupo(organizationId);
  res.status(200).json({ siguienteNumero });
};

// export const getProductosByGrupoHandler = async (
//   req: TypedRequest<any, typeof listProductosByGrupoSchema, any>,
//   res: Response,
// ) => {
//   const { organizationId, usuario } = getContext(req);

//   const { grupoId, page, search } = req.query;
//   const limit = 10;

//   // Reutilizar el servicio de productos existente
//   const { productos, total } = await listProductos({
//     grupoId,
//     limit,
//     organizationId,
//     page,
//     search,
//   });

//   res.status(200).json({
//     data: productos,
//     pagination: {
//       limit,
//       page,
//       totalItems: total,
//       totalPages: Math.ceil(total / limit),
//     },
//   });
// };

export const createGrupoHandler = async (
  req: Request<{}, {}, CrearGrupoDto>,
  res: Response,
) => {
  const { organizationId, userEmail } = getContext(req);
  const data = req.body;

  const grupo = await service.createGrupo(data, organizationId, userEmail);

  res.status(201).json(grupo);
};

export const updateGrupoHandler = async (
  req: Request<{ id: string }, {}, ActualizarGrupoDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;
  const data = req.body;

  const grupo = await service.updateGrupo(Number(id), data, organizationId);
  res.status(200).json(grupo);
};

export const deleteGrupoHandler = async (
  req: Request<{ id: string }, {}, {}>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { id } = req.params;

  await service.deleteGrupo(Number(id), organizationId);
  res.status(204).send();
};
