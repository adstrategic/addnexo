import { prisma, type Prisma } from "@repo/db";

import {
  ConflictError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";

export interface Period {
  ano: number;
  mes: number;
}

export type PeriodWithLabel = Period & { label: string };

export type AvailablePeriod = Period & {
  closed: boolean;
  label: string;
};

export interface ZeroCostEntry {
  cantidad: number;
  esCostoTemporalCero: boolean;
  fecha: string;
  movimientoId: number;
  producto: string;
  secuencial: number;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function periodSortKey(mes: number, ano: number): number {
  return ano * 100 + mes;
}

export function comparePeriods(a: Period, b: Period): number {
  return periodSortKey(a.mes, a.ano) - periodSortKey(b.mes, b.ano);
}

export function expandAno(ano: number): number {
  return ano >= 100 ? ano : 2000 + ano;
}

export function currentPeriod(): Period {
  const now = new Date();
  return {
    mes: now.getMonth() + 1,
    ano: now.getFullYear() % 100,
  };
}

export function nextPeriod(mes: number, ano: number): Period {
  if (mes === 12) {
    return { mes: 1, ano: ano + 1 };
  }
  return { mes: mes + 1, ano };
}

export function buildPeriodLabel(mes: number, ano: number): string {
  const monthName = MONTH_NAMES[mes - 1] ?? String(mes);
  return `${monthName} ${expandAno(ano)}`;
}

export function periodFromDate(date: Date): Period {
  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear() % 100,
  };
}

export async function assertPriorPeriodsClosed(
  organizationId: string,
  target: Period,
): Promise<void> {
  const { periodsNeedingClose } = await checkClosingStatus(organizationId);
  const blocking = periodsNeedingClose.filter(
    (p) => comparePeriods(p, target) < 0,
  );

  if (blocking.length > 0) {
    const first = blocking[0]!;
    throw new EntityValidationError(
      `You must close ${first.label} before registering movements dated ${buildPeriodLabel(target.mes, target.ano)}.`,
    );
  }
}

async function getLastClosedPeriod(
  organizationId: string,
): Promise<null | Period> {
  const closings = await prisma.periodoCierre.findMany({
    where: { organizationId },
    select: { mes: true, ano: true },
    orderBy: [{ ano: "desc" }, { mes: "desc" }],
    take: 1,
  });

  const latest = closings[0];
  return latest ? { mes: latest.mes, ano: latest.ano } : null;
}

export async function getActivePeriod(
  userId: string,
  organizationId: string,
): Promise<Period> {
  const active = await prisma.periodoActivo.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    select: { mes: true, ano: true },
  });

  if (active) {
    return { mes: active.mes, ano: active.ano };
  }

  const lastClosed = await getLastClosedPeriod(organizationId);
  if (lastClosed) {
    return nextPeriod(lastClosed.mes, lastClosed.ano);
  }

  return currentPeriod();
}

export async function setActivePeriod(
  userId: string,
  organizationId: string,
  mes: number,
  ano: number,
): Promise<Period> {
  const row = await prisma.periodoActivo.upsert({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    create: {
      userId,
      organizationId,
      mes,
      ano,
    },
    update: {
      mes,
      ano,
    },
    select: { mes: true, ano: true },
  });

  return { mes: row.mes, ano: row.ano };
}

async function getDistinctKardexPeriods(
  organizationId: string,
): Promise<Period[]> {
  const rows = await prisma.kardex.findMany({
    where: { KOrganizationId: organizationId },
    select: { KMes: true, KAno: true },
    distinct: ["KMes", "KAno"],
  });

  return rows
    .map((row) => ({ mes: row.KMes, ano: row.KAno }))
    .sort(comparePeriods);
}

export async function listAvailablePeriods(
  organizationId: string,
): Promise<AvailablePeriod[]> {
  const periods = await getDistinctKardexPeriods(organizationId);
  const current = currentPeriod();

  const hasCurrent = periods.some(
    (p) => p.mes === current.mes && p.ano === current.ano,
  );
  if (!hasCurrent) {
    periods.push(current);
    periods.sort(comparePeriods);
  }

  const closings = await prisma.periodoCierre.findMany({
    where: { organizationId },
    select: { mes: true, ano: true },
  });
  const closedSet = new Set(closings.map((c) => `${c.mes}-${c.ano}`));

  return periods.map((period) => ({
    ...period,
    label: buildPeriodLabel(period.mes, period.ano),
    closed: closedSet.has(`${period.mes}-${period.ano}`),
  }));
}

export async function checkClosingStatus(organizationId: string): Promise<{
  lastClosedPeriod: null | Period;
  periodsNeedingClose: PeriodWithLabel[];
}> {
  const kardexPeriods = await getDistinctKardexPeriods(organizationId);
  const current = currentPeriod();
  const lastClosedPeriod = await getLastClosedPeriod(organizationId);

  if (kardexPeriods.length === 0) {
    return { periodsNeedingClose: [], lastClosedPeriod };
  }

  const oldest = kardexPeriods[0]!;
  const periodsWithKardex = new Set(
    kardexPeriods.map((p) => `${p.mes}-${p.ano}`),
  );

  const closings = await prisma.periodoCierre.findMany({
    where: { organizationId },
    select: { mes: true, ano: true },
  });
  const closedSet = new Set(closings.map((c) => `${c.mes}-${c.ano}`));

  const periodsNeedingClose: PeriodWithLabel[] = [];
  let cursor = { ...oldest };

  while (comparePeriods(cursor, current) <= 0) {
    const key = `${cursor.mes}-${cursor.ano}`;
    if (periodsWithKardex.has(key) && !closedSet.has(key)) {
      periodsNeedingClose.push({
        mes: cursor.mes,
        ano: cursor.ano,
        label: buildPeriodLabel(cursor.mes, cursor.ano),
      });
    }
    cursor = nextPeriod(cursor.mes, cursor.ano);
  }

  return { periodsNeedingClose, lastClosedPeriod };
}

export async function validatePreClose(
  organizationId: string,
  mes: number,
  ano: number,
): Promise<
  { entries: ZeroCostEntry[]; message: string; valid: false } | { valid: true }
> {
  const movements = await prisma.movkar.findMany({
    where: {
      MVOrganizationId: organizationId,
      kardexDet: {
        KDMes: mes,
        KDAno: ano,
      },
      tmovkar: {
        TTipo: 1,
        TAjusteInventario: false,
      },
      OR: [{ MVCostoPrecio: 0 }, { MVEsCostoTemporalCero: true }],
    },
    include: {
      invcaruni: {
        select: { CKDescripcion: true },
      },
    },
    orderBy: [{ MVFecha: "asc" }, { MVSecuencial: "asc" }],
  });

  if (movements.length === 0) {
    return { valid: true };
  }

  const entries: ZeroCostEntry[] = movements.map((mv) => ({
    movimientoId: mv.MVId,
    secuencial: mv.MVSecuencial,
    producto: mv.invcaruni.CKDescripcion,
    fecha: mv.MVFecha.toISOString().slice(0, 10),
    cantidad: Number(mv.MVCantidad),
    esCostoTemporalCero: mv.MVEsCostoTemporalCero,
  }));

  return {
    valid: false,
    entries,
    message:
      "Cannot close the period: there are entry movements with zero inventory cost. Resolve them before closing.",
  };
}

async function obtenerSiguienteSecuenciaKardex(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<number> {
  const ultimoKardex = await tx.kardex.findFirst({
    where: { KOrganizationId: organizationId },
    orderBy: { KOrgSecuencia: "desc" },
  });

  return (ultimoKardex?.KOrgSecuencia || 0) + 1;
}

export async function closePeriod(
  organizationId: string,
  mes: number,
  ano: number,
  closedBy: string,
): Promise<{
  kardexCreated: number;
  lotsCreated: number;
  newPeriod: Period;
}> {
  const existing = await prisma.periodoCierre.findUnique({
    where: {
      organizationId_mes_ano: { organizationId, mes, ano },
    },
  });

  if (existing) {
    throw new ConflictError("This period is already closed.");
  }

  const validation = await validatePreClose(organizationId, mes, ano);
  if (!validation.valid) {
    throw new EntityValidationError(validation.message);
  }

  const newPeriod = nextPeriod(mes, ano);

  const kardexRows = await prisma.kardex.findMany({
    where: {
      KOrganizationId: organizationId,
      KMes: mes,
      KAno: ano,
    },
    include: {
      kardexLotes: true,
    },
  });

  return prisma.$transaction(async (tx) => {
    let kardexCreated = 0;
    let lotsCreated = 0;

    for (const kardex of kardexRows) {
      let nextKardex = await tx.kardex.findFirst({
        where: {
          KOrganizationId: organizationId,
          KInvcaruniId: kardex.KInvcaruniId,
          KAlmacenId: kardex.KAlmacenId,
          KMes: newPeriod.mes,
          KAno: newPeriod.ano,
        },
      });

      if (!nextKardex) {
        const siguienteSecuencia = await obtenerSiguienteSecuenciaKardex(
          tx,
          organizationId,
        );

        nextKardex = await tx.kardex.create({
          data: {
            KOrganizationId: organizationId,
            KInvcaruniId: kardex.KInvcaruniId,
            KAlmacenId: kardex.KAlmacenId,
            KExistenciaInicial: kardex.KExistenciaFin,
            KExistenciaFin: kardex.KExistenciaFin,
            KCostoUltimo: kardex.KCostoUltimo,
            KCostoPromedio: kardex.KCostoPromedio,
            KLValorCostoUltimo: kardex.KLValorCostoUltimo,
            KLValorCostoPromedio: kardex.KLValorCostoPromedio,
            KExistenciaMin: kardex.KExistenciaMin,
            KExistenciaMax: kardex.KExistenciaMax,
            KTiempoReposicion: kardex.KTiempoReposicion,
            KNroTarjeta: kardex.KNroTarjeta,
            KUltimoDetalle: kardex.KUltimoDetalle,
            KOrgSecuencia: siguienteSecuencia,
            KMes: newPeriod.mes,
            KAno: newPeriod.ano,
            usuario: closedBy,
          },
        });
        kardexCreated++;
      }

      for (const lote of kardex.kardexLotes) {
        if (Number(lote.KLExistenciaFin) <= 0) {
          continue;
        }

        const existingLot = await tx.kardexLote.findFirst({
          where: {
            KLKardexId: nextKardex.KId,
            KLCiudadId: lote.KLCiudadId,
            KLLote: lote.KLLote,
            KLNroDocumento: lote.KLNroDocumento,
            KLMes: newPeriod.mes,
            KLAno: newPeriod.ano,
          },
        });

        if (existingLot) {
          continue;
        }

        await tx.kardexLote.create({
          data: {
            KLKardexId: nextKardex.KId,
            KLOrganizationId: organizationId,
            KLCiudadId: lote.KLCiudadId,
            KLInvcaruniId: lote.KLInvcaruniId,
            KAlmacenId: lote.KAlmacenId,
            KLLote: lote.KLLote,
            KLNroDocumento: lote.KLNroDocumento,
            KLExistenciaInicial: lote.KLExistenciaFin,
            KLExistenciaFin: lote.KLExistenciaFin,
            KLCostoUltimo: lote.KLCostoUltimo,
            KLCostoPromedio: lote.KLCostoPromedio,
            KLValorCostoUltimo: lote.KLValorCostoUltimo,
            KLValorCostoPromedio: lote.KLValorCostoPromedio,
            KLMes: newPeriod.mes,
            KLAno: newPeriod.ano,
            usuario: closedBy,
          },
        });
        lotsCreated++;
      }
    }

    await tx.periodoCierre.create({
      data: {
        organizationId,
        mes,
        ano,
        cerradoPor: closedBy,
      },
    });

    return { kardexCreated, lotsCreated, newPeriod };
  });
}

export async function isPeriodOpen(
  organizationId: string,
  mes: number,
  ano: number,
): Promise<boolean> {
  const closing = await prisma.periodoCierre.findUnique({
    where: {
      organizationId_mes_ano: { organizationId, mes, ano },
    },
    select: { id: true },
  });

  return !closing;
}
