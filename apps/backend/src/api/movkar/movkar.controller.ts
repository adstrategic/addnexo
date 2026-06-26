import type { Request, Response } from "express";

import { ZodError } from "zod";

import { getContext } from "../../middleware/context.middleware.js";
import * as service from "./movkar.service.js";
import {
  ActualizarCostoCeroDto,
  buscarMovimientosSchema,
  costoPromedioQuerySchema,
  CrearMovimientoDto,
  CrearMovimientosBulkDto,
  obtenerUltimoLoteSchema,
} from "./movkar.validator.js";

export const listarMovimientosHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  const parsed = buscarMovimientosSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid query parameters",
      issues: parsed.error.issues,
    });
  }
  const validatedQuery = parsed.data;

  const { movimientos, total } = await service.listarMovimientos({
    ...validatedQuery,
    organizationId,
  });

  res.status(200).json({
    data: movimientos,
    pagination: {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      totalItems: total,
      totalPages: Math.ceil(total / validatedQuery.limit),
    },
  });
};

export const obtenerMovimientoPorSecuencialHandler = async (
  req: Request<{ secuencial: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const secuencial = Number(req.params.secuencial);

  if (isNaN(secuencial) || secuencial <= 0) {
    return res.status(400).json({
      message: "Sequence must be a valid number greater than 0",
    });
  }

  const movimiento = await service.obtenerMovimientoPorSecuencial(
    secuencial,
    organizationId,
  );

  if (!movimiento) {
    return res.status(404).json({
      message: "Movement not found",
    });
  }

  res.status(200).json(movimiento);
};

export const crearMovimientoHandler = async (
  req: Request<Record<string, never>, unknown, CrearMovimientoDto>,
  res: Response,
) => {
  const { organizationId, userEmail, mes, ano } = getContext(req);
  const data = req.body;

  const nuevoMovimiento = await service.crearMovimiento(
    {
      ...data,
      organizationId,
    },
    userEmail,
    false,
    { mes, ano },
  );

  res.status(201).json({
    message: "Movement created successfully",
    data: nuevoMovimiento,
  });
};

export const crearMovimientosBulkHandler = async (
  req: Request<Record<string, never>, unknown, CrearMovimientosBulkDto>,
  res: Response,
) => {
  const { organizationId, userEmail, mes, ano } = getContext(req);
  const { lineas } = req.body;

  const { data: created, count } = await service.crearMovimientosBulk(
    { lineas },
    organizationId,
    userEmail,
    false,
    { mes, ano },
  );

  res.status(201).json({
    message: `Created ${String(count)} movement(s) successfully`,
    data: created,
    count,
  });
};

export const obtenerCostoPromedioHandler = async (
  req: Request,
  res: Response,
) => {
  const { organizationId, mes, ano } = getContext(req);

  const parsed = costoPromedioQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "invcaruniId and almacenId must be positive integers",
      issues: parsed.error.issues,
    });
  }

  const { invcaruniId, almacenId } = parsed.data;

  const resultado = await service.obtenerCostoPromedioProducto(
    organizationId,
    invcaruniId,
    almacenId,
    undefined,
    mes,
    ano,
  );

  res.status(200).json(resultado);
};

export const obtenerUltimoLoteHandler = async (req: Request, res: Response) => {
  const { organizationId } = getContext(req);

  let query: { almacenId: number; invcaruniId: number; nroDocumento?: string };
  try {
    query = obtenerUltimoLoteSchema.parse(req.query);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Invalid query parameters",
        issues: err.issues,
      });
    }
    throw err;
  }

  const ultimoLote = await service.obtenerUltimoLoteDisponible(
    organizationId,
    query.invcaruniId,
    query.almacenId,
    query.nroDocumento,
  );

  res.status(200).json({ ultimoLote });
};

export const actualizarCostoCeroHandler = async (
  req: Request<{ id: string }, unknown, ActualizarCostoCeroDto>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const movimientoId = Number(req.params.id);

  if (isNaN(movimientoId) || movimientoId <= 0) {
    return res.status(400).json({
      message: "Movement ID must be a valid number greater than 0",
    });
  }

  const { nuevoCosto } = req.body;

  const resultado = await service.actualizarCostoEntradaCero(
    organizationId,
    movimientoId,
    nuevoCosto,
  );

  res.status(200).json({
    message: "Cost updated successfully",
    data: resultado,
  });
};
