import type { Request, Response } from "express";
import * as service from "./mov-cxc.service.js";
import { getContext } from "../../middleware/context.middleware.js";
import { EstadoFactura, TipoPropositoMovkar } from "@repo/db";

type ListCreditNotesQuery = {
  page: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  estado?: EstadoFactura;
};

/**
 * Handler para listar credit notes con paginación y filtros
 */
export const listCreditNotesHandler = async (
  req: Request<{}, {}, {}, ListCreditNotesQuery>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page = 1, search, dateFrom, dateTo, estado } = req.query;
  const limit = 10;

  const { movimientos, total } = await service.listMovCXC({
    page: Number(page),
    limit,
    search,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    estado,
    organizationId,
    tipoProposito: [
      TipoPropositoMovkar.NOTA_CREDITO,
      TipoPropositoMovkar.NOTA_CREDITO_CON_DEVOLUCION,
    ],
  });

  res.status(200).json({
    data: movimientos,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

type ListDebitNotesQuery = {
  page: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  estado?: EstadoFactura;
};
/**
 * Handler para listar debit notes con paginación y filtros
 */
export const listDebitNotesHandler = async (
  req: Request<{}, {}, {}, ListDebitNotesQuery>,
  res: Response,
) => {
  const { organizationId } = getContext(req);

  const { page = 1, search, dateFrom, dateTo, estado } = req.query;
  const limit = 10;

  const { movimientos, total } = await service.listMovCXC({
    page: Number(page),
    limit,
    search,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    estado,
    organizationId,
    tipoProposito: [TipoPropositoMovkar.NOTA_DEBITO],
  });

  res.status(200).json({
    data: movimientos,
    pagination: {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

/**
 * Handler para obtener un credit note por su secuencia
 */
export const getCreditNoteBySecuenciaHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const creditNote = await service.getMovCXCBySecuencia(
    Number(secuencia),
    organizationId,
    [
      TipoPropositoMovkar.NOTA_CREDITO,
      TipoPropositoMovkar.NOTA_CREDITO_CON_DEVOLUCION,
    ],
  );

  if (!creditNote) {
    return res.status(404).json({ message: "Credit note not found." });
  }

  res.status(200).json(creditNote);
};

/**
 * Handler para obtener un debit note por su secuencia
 */
export const getDebitNoteBySecuenciaHandler = async (
  req: Request<{ secuencia: string }>,
  res: Response,
) => {
  const { organizationId } = getContext(req);
  const { secuencia } = req.params;

  const debitNote = await service.getMovCXCBySecuencia(
    Number(secuencia),
    organizationId,
    [TipoPropositoMovkar.NOTA_DEBITO],
  );

  if (!debitNote) {
    return res.status(404).json({ message: "Debit note not found." });
  }

  res.status(200).json(debitNote);
};
