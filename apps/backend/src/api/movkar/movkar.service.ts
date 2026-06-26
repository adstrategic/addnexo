import {
  type Kardex,
  type KardexLote,
  type Movkar,
  prisma,
  type Prisma,
  type Tmovkar,
} from "@repo/db";

import type {
  BuscarMovimientosOptions,
  CrearMovimientoDto,
  ValidarExistenciasDto,
} from "./movkar.validator.js";

import {
  EntityNotFoundError,
  EntityValidationError,
  InsufficientStockError,
} from "../../errors/EntityErrors.js";
import {
  buildPeriodLabel,
  isPeriodOpen,
  type Period,
  periodFromDate,
} from "../period/period.service.js";
import { getReservedQuantityByLote } from "../reservations/reservations.service.js";

// ===============================================
// SERVICIOS DE CONSULTA
// ===============================================

// Función para obtener costo promedio (para uso del frontend)
export const obtenerCostoPromedioProducto = async (
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  tx?: Prisma.TransactionClient,
  mes?: number,
  ano?: number,
) => {
  const db = tx ?? prisma;
  const kardex = await db.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
      // Kardex holds one record per product+warehouse+period; scope to the active
      // period when provided so we never return a stale cost from a prior month.
      ...(mes !== undefined && ano !== undefined
        ? { KMes: mes, KAno: ano }
        : {}),
    },
    select: {
      KCostoPromedio: true,
    },
  });

  return {
    costoPromedio: Number(kardex?.KCostoPromedio ?? 0),
  };
};

export const listarMovimientos = async (
  options: BuscarMovimientosOptions & { organizationId: string },
) => {
  const {
    page,
    limit,
    search,
    organizationId,
    tipoMovimiento,
    fechaInicio,
    fechaFin,
    kardexLoteId,
    proveedorId,
    clienteId,
    nroDocumento,
    invcaruniId,
    group,
    country,
  } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.MovkarWhereInput = {
    MVOrganizationId: organizationId,
  };

  // Filtros opcionales
  if (tipoMovimiento) {
    where.MVTipoMovimientoId = Number(tipoMovimiento);
  }

  if (invcaruniId) {
    where.MVInvcaruniId = invcaruniId;
  }

  if (group || country) {
    where.invcaruni = {
      ...(group ? { grupo: { GDescripcion: group } } : {}),
      ...(country ? { origenPais: { nombre: country } } : {}),
    };
  }

  if (fechaInicio && fechaFin) {
    where.MVFecha = {
      gte: fechaInicio,
      lte: fechaFin,
    };
  }

  if (proveedorId) {
    where.MVProveedorId = proveedorId;
  }

  if (clienteId) {
    where.MVClienteId = clienteId;
  }

  if (nroDocumento) {
    where.MVNroDocumento = nroDocumento;
  }

  if (kardexLoteId) {
    where.kardexDet = { KDKardexLoteId: kardexLoteId };
  }

  if (search && search.trim()) {
    where.OR = [
      {
        invcaruni: {
          CKDescripcion: { contains: search, mode: "insensitive" },
        },
      },
      {
        mproved: {
          MPDescripcion: { contains: search, mode: "insensitive" },
        },
      },
      {
        cltemae: {
          CNombreCliente: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const [items, total] = await prisma.$transaction([
    prisma.movkar.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ MVFecha: "asc" }, { MVId: "asc" }],
      include: {
        tmovkar: {
          select: {
            TDescripcion: true,
            TAbreviatura: true,
            TTipo: true,
            TClase: true,
            TAfecta: true,
          },
        },
        invcaruni: {
          select: {
            CKDescripcion: true,
            CKOrigenId: true,
            origenPais: {
              select: {
                id: true,
                nombre: true,
              },
            },
            CKCodigo: true,
          },
        },
        almacen: {
          select: {
            ALNombre: true,
          },
        },
        mproved: {
          select: {
            MPDescripcion: true,
            MPNro: true,
          },
        },
        cltemae: {
          select: {
            CNombreCliente: true,
            CNitCedula: true,
          },
        },
      },
    }),
    prisma.movkar.count({ where }),
  ]);
  const movimientos = items.map((item) => {
    const partnerName =
      item.mproved?.MPDescripcion || item.cltemae?.CNombreCliente || "-";
    const lotDocument =
      item.MVLoteNroDocumento || item.MVNroDocumento || String(item.MVLote);
    const dashboardTransac = item.tmovkar.TDescripcion;

    return {
      ...item,
      dashboardTransac,
      dashboardType: item.tmovkar.TTipo,
      dashboardClass: item.tmovkar.TClase,
      dashboardPartner: partnerName,
      dashboardNrDoc: `${item.MVLote}-${lotDocument}`,
      dashboardPurchaseOrInvoiceRef: item.MVNroDocumento,
      dashboardLastCost: Number(item.MVCostoSalida || item.MVCostoUltimo || 0),
      dashboardSalePrice: 0,
    };
  });

  return { movimientos, total };
};

export const obtenerMovimientoPorId = async (
  id: number,
  organizationId: string,
) => {
  return prisma.movkar.findFirst({
    where: {
      MVId: id,
      MVOrganizationId: organizationId,
    },
    include: {
      tmovkar: true,
      invcaruni: true,
      almacen: true,
      organization: true,
      mproved: true,
      cltemae: true,
      ciudad: true,
    },
  });
};

export const obtenerMovimientoPorSecuencial = async (
  secuencial: number,
  organizationId: string,
) => {
  const movimiento = await prisma.movkar.findFirst({
    where: {
      MVOrgSecuencia: secuencial,
      MVOrganizationId: organizationId,
    },
    include: {
      tmovkar: {
        select: {
          TId: true,
          TDescripcion: true,
          TTipo: true,
          TAfecta: true,
          TProv: true,
          TPedido: true,
          TFactura: true,
        },
      },
      invcaruni: {
        select: {
          CKId: true,
          CKDescripcion: true,
          CKOrigenId: true,
          origenPais: {
            select: {
              id: true,
              nombre: true,
            },
          },
          CKPrecioPublico: true,
        },
      },
      almacen: {
        select: {
          ALId: true,
          ALNombre: true,
          ALTelefono: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      mproved: {
        select: {
          MPId: true,
          MPDescripcion: true,
          MPNro: true,
        },
      },
      cltemae: {
        select: {
          CId: true,
          CNombreCliente: true,
          CNitCedula: true,
        },
      },
      kardexDet: {
        select: {
          KDId: true,
          KDFecha: true,
          KDExistenciaFin: true,
        },
      },
    },
  });

  return movimiento;
};

// ===============================================
// VALIDACIONES DE NEGOCIO (Basadas en COBOL)
// ===============================================

export const validarTipoMovimiento = async (
  tipoMovimientoId: number,
  organizationId: string,
  tx?: Prisma.TransactionClient,
) => {
  const client = tx ?? prisma;
  const tipoMovimiento = await client.tmovkar.findFirst({
    where: {
      TId: tipoMovimientoId,
      TOrganizationId: organizationId,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityNotFoundError("Transaction not registered");
  }

  return tipoMovimiento;
};

export const validarExistencias = async (
  data: ValidarExistenciasDto & {
    almacenId: number;
    invcaruniId: number;
    organizationId: string;
  },
) => {
  const { tipoMovimiento, organizationId, invcaruniId, almacenId } = data;

  // Solo validar para salidas (tipo 2)
  if (tipoMovimiento !== 2) {
    return { valido: true, existenciaActual: 0 };
  }

  // NUEVA LÓGICA: Buscar en Kardex padre para obtener existencias totales
  const kardex = await prisma.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
    },
  });

  if (!kardex) {
    throw new EntityNotFoundError("Kardex record not found - please verify");
  }

  const existenciaTotal = Number(kardex.KExistenciaFin);

  // Uses parent kardex aggregate (matches legacy COBOL path). When
  // getReservedQuantityByLote is implemented, reconcile with lot-level availability.
  if (existenciaTotal <= 0) {
    throw new EntityValidationError("Cannot make outputs with zero stock");
  }

  if (data.cantidad > existenciaTotal) {
    throw new EntityValidationError("Insufficient stock in total inventory");
  }

  return { valido: true, existenciaActual: existenciaTotal };
};

export const obtenerUltimoLoteDisponible = async (
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  nroDocumento?: string,
): Promise<string> => {
  const whereClause: Prisma.MovkarWhereInput = {
    MVOrganizationId: organizationId,
    MVAlmacenId: almacenId,
    tmovkar: {
      TTipo: 1, // Solo entradas
    },
  };

  // If nroDocumento is provided, filter by it
  if (nroDocumento) {
    whereClause.MVNroDocumento = nroDocumento;
  }

  const ultimoMovimiento = await prisma.movkar.findFirst({
    where: whereClause,
    orderBy: {
      MVLote: "desc",
    },
    select: {
      MVLote: true,
    },
  });

  return ultimoMovimiento?.MVLote ?? "";
};

export async function validarMesCerrado(
  organizationId: string,
  mes: number,
  ano: number,
): Promise<void> {
  const open = await isPeriodOpen(organizationId, mes, ano);
  if (!open) {
    throw new EntityValidationError(
      `Period ${buildPeriodLabel(mes, ano)} is closed. No movements can be created.`,
    );
  }
}

function assertMovementDateInPeriod(mvFecha: Date, period: Period): void {
  const fechaPeriod = periodFromDate(mvFecha);
  if (fechaPeriod.mes !== period.mes || fechaPeriod.ano !== period.ano) {
    throw new EntityValidationError(
      `Movements for this period must be dated within ${buildPeriodLabel(period.mes, period.ano)}.`,
    );
  }
}

export const validarProveedorCliente = async (
  tipoMovimiento: Tmovkar,
  proveedorId: null | number,
  clienteId: null | number,
  organizationId: string,
  tx?: Prisma.TransactionClient,
) => {
  const client = tx ?? prisma;

  // The movement type record is the source of truth: a supplier is required only
  // when TProv is set on an entry, and a customer only when TCliente is set on an exit.
  const shouldRequireProveedor =
    tipoMovimiento.TTipo === 1 && tipoMovimiento.TProv === true;
  const shouldRequireCliente =
    tipoMovimiento.TTipo === 2 && tipoMovimiento.TCliente === true;

  if (shouldRequireProveedor && !proveedorId) {
    throw new EntityValidationError(
      "Supplier required for this type of movement",
    );
  }

  if (shouldRequireCliente && !clienteId) {
    throw new EntityValidationError(
      "Client required for this type of movement",
    );
  }

  // Whenever an id is provided (even if not strictly required), verify it belongs
  // to the organization to prevent cross-tenant references.
  if (proveedorId) {
    const proveedor = await client.mproved.findFirst({
      where: {
        MPId: proveedorId,
        MPOrganizationId: organizationId,
      },
    });

    if (!proveedor) {
      throw new EntityNotFoundError("Supplier not registered");
    }
  }

  if (clienteId) {
    const cliente = await client.cltemae.findFirst({
      where: {
        CId: clienteId,
        COrganizationId: organizationId,
      },
    });

    if (!cliente) {
      throw new EntityNotFoundError("Client not registered");
    }
  }
};

// ===============================================
// OPERACIONES PRINCIPALES
// ===============================================

/**
 * Crea un movimiento de inventario dentro de una transacción existente
 * Versión que acepta un cliente de transacción
 */
export const crearMovimientoConTx = async (
  tx: Prisma.TransactionClient,
  data: CrearMovimientoDto & {
    MVLoteNroDocumento?: string;
    organizationId: string;
  },
  usuario: string,
  devolucionDeCliente: boolean,
  period: Period,
) => {
  const { organizationId, invcaruniId, almacenId, ciudadId } = data;

  // 1. Validar tipo de movimiento (líneas 348-356 del COBOL)
  const tipoMovimiento = await validarTipoMovimiento(
    data.MVTipoMovimientoId,
    organizationId,
    tx,
  );

  const calcularCostoPromedio = tipoMovimiento.TRecalcular;

  // 2. Validar mes cerrado (líneas 314-318 del COBOL)
  await validarMesCerrado(organizationId, period.mes, period.ano);

  // 3. Obtener o crear kardex padre (producto-almacén)
  const kardex = await obtenerOCrearKardex(
    tx,
    organizationId,
    invcaruniId,
    almacenId,
    usuario,
    period.mes,
    period.ano,
  );

  // 4. Validar proveedor/cliente según tipo (omitir para ajustes de inventario)
  if (!devolucionDeCliente && !tipoMovimiento.TAjusteInventario) {
    await validarProveedorCliente(
      tipoMovimiento,
      data.MVProveedorId ?? null,
      data.MVClienteId || null,
      organizationId,
      tx,
    );
  }

  // 4b. Para entradas normales (no ajuste), el costo debe ser > 0 o marcar como costo temporal cero
  if (
    tipoMovimiento.TTipo === 1 &&
    !tipoMovimiento.TAjusteInventario &&
    !data.MVEsCostoTemporalCero &&
    (data.MVCostoPrecio ?? 0) === 0
  ) {
    throw new EntityValidationError(
      "Cost/price must be greater than 0 or check the temporary zero cost option.",
    );
  }

  // 5. NUEVA LÓGICA: Separar flujo por tipo de movimiento
  if (tipoMovimiento.TTipo === 1) {
    // ============ ENTRADA ============
    // For inventory adjustments with no cost provided, use the current kardex avg cost
    // so value fields are calculated correctly without recalculating the avg cost.
    let dataEntrada = data;
    if (tipoMovimiento.TAjusteInventario && (data.MVCostoPrecio ?? 0) === 0) {
      const costoPromedio = Number(kardex.KCostoPromedio || 0);
      dataEntrada = { ...data, MVCostoPrecio: costoPromedio };
    }

    // First-time adjustment registration: user supplied a cost and the kardex has no avg cost yet.
    // Treat as importation so avg cost and last cost are set on kardex, kardexLote, and kardexDet.
    const esPrimerRegistroAjuste =
      tipoMovimiento.TAjusteInventario &&
      (dataEntrada.MVCostoPrecio ?? 0) > 0 &&
      Number(kardex.KCostoPromedio || 0) === 0;

    return await procesarEntrada(
      tx,
      kardex,
      dataEntrada,
      tipoMovimiento,
      organizationId,
      invcaruniId,
      almacenId,
      ciudadId,
      usuario,
      esPrimerRegistroAjuste ? true : calcularCostoPromedio,
      devolucionDeCliente,
      period,
    );
  } else {
    // ============ SALIDA ============
    const { costoPromedio, costoUltimo } = await obtenerCostosKardex(
      tx,
      organizationId,
      invcaruniId,
      almacenId,
    );

    const dataConCosto = {
      ...data,
      MVCostoSalida: costoPromedio,
    };

    return await procesarSalida(
      tx,
      kardex,
      dataConCosto,
      tipoMovimiento,
      organizationId,
      invcaruniId,
      almacenId,
      ciudadId,
      usuario,
      calcularCostoPromedio,
      costoPromedio,
      costoUltimo,
      period,
    );
  }
};

export const crearMovimiento = async (
  data: CrearMovimientoDto & {
    organizationId: string;
  },
  usuario: string,
  devolucionDeCliente: boolean,
  period: Period,
) => {
  assertMovementDateInPeriod(data.MVFecha, period);

  return prisma.$transaction(async (tx) => {
    return await crearMovimientoConTx(
      tx,
      data,
      usuario,
      devolucionDeCliente,
      period,
    );
  });
};

/**
 * Creates multiple movements (input or output) in a single transaction.
 * Each line is one movement; on any failure the whole transaction rolls back.
 */
export const crearMovimientosBulk = async (
  payload: { lineas: CrearMovimientoDto[] },
  organizationId: string,
  usuario: string,
  devolucionDeCliente: boolean,
  period: Period,
) => {
  for (const linea of payload.lineas) {
    assertMovementDateInPeriod(linea.MVFecha, period);
  }

  const created = await prisma.$transaction(async (tx) => {
    const results: Awaited<ReturnType<typeof crearMovimientoConTx>>[] = [];
    for (const linea of payload.lineas) {
      const movimiento = await crearMovimientoConTx(
        tx,
        { ...linea, organizationId },
        usuario,
        devolucionDeCliente,
        period,
      );
      results.push(movimiento);
    }
    return results;
  });
  return { data: created, count: created.length };
};

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================

// Función para obtener costo promedio y costo último del kardex padre
async function obtenerCostosKardex(
  tx: Prisma.TransactionClient,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
): Promise<{ costoPromedio: number; costoUltimo: number }> {
  const kardex = await tx.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
    },
    select: {
      KCostoPromedio: true,
      KCostoUltimo: true,
    },
  });

  return {
    costoPromedio: Number(kardex?.KCostoPromedio || 0),
    costoUltimo: Number(kardex?.KCostoUltimo || 0),
  };
}

async function obtenerOCrearKardex(
  tx: Prisma.TransactionClient,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  usuario: string,
  mes: number,
  ano: number,
) {
  // Buscar kardex padre existente
  let kardex = await tx.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
      KMes: mes,
      KAno: ano,
    },
  });

  if (!kardex) {
    // Crear kardex padre si no existe (líneas 887-894 del COBOL)
    const siguienteSecuencia = await obtenerSiguienteSecuenciaKardex(
      tx,
      organizationId,
    );

    kardex = await tx.kardex.create({
      data: {
        KOrganizationId: organizationId,
        KInvcaruniId: invcaruniId,
        KAlmacenId: almacenId,
        KNroTarjeta: "000001", // Valor por defecto
        KUltimoDetalle: "INICIAL",
        KOrgSecuencia: siguienteSecuencia,
        KMes: mes,
        KAno: ano,
        usuario,
        // TODO: revisar si se debe setear el valor por defecto
        KFechaUltimoConteo: new Date(),
      },
    });
  }

  return kardex;
}

async function obtenerOCrearKardexLote(
  tx: Prisma.TransactionClient,
  kardexId: number,
  lote: string,
  nroDocumento: string,
  ciudadId: number,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  usuario: string,
  fecha: Date,
  mes: number,
  ano: number,
) {
  // Buscar kardex lote existente
  let kardexLote = await tx.kardexLote.findFirst({
    where: {
      KLKardexId: kardexId,
      KLLote: lote,
      KLNroDocumento: nroDocumento,
      KLCiudadId: ciudadId,
      KLOrganizationId: organizationId,
      KLMes: mes,
      KLAno: ano,
    },
  });

  // Crear kardex lote si no existe (líneas 923-934 del COBOL)
  kardexLote ??= await tx.kardexLote.create({
    data: {
      KLOrganizationId: organizationId,
      KLKardexId: kardexId,
      KLCiudadId: ciudadId,
      KLInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
      KLLote: lote,
      KLNroDocumento: nroDocumento, // Differentiate by document number
      KLMes: mes,
      KLAno: ano,
      KLFechaUltimaEntrada: fecha,
      usuario,
    },
  });

  return kardexLote;
}

async function obtenerOCrearKardexDet(
  tx: Prisma.TransactionClient,
  kardexLoteId: number,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  lote: string,
  fecha: Date,
  usuario: string,
  mes: number,
  ano: number,
) {
  // Buscar kardex detallado existente para la fecha (optimizado con nuevo constraint)
  // TODO: use unique constraint instead of findFirst
  let kardexDet = await tx.kardexDet.findFirst({
    where: {
      KDKardexLoteId: kardexLoteId,
      KDFecha: fecha,
      KDMes: mes,
      KDAno: ano,
    },
  });

  // Crear nuevo registro siguiendo lógica del COBOL con campos desnormalizados
  kardexDet ??= await tx.kardexDet.create({
    data: {
      KDKardexLoteId: kardexLoteId,
      KDOrganizationId: organizationId,
      KDInvcaruniId: invcaruniId,
      KDAlmacenId: almacenId,
      KDCiudadId: ciudadId,
      KDLote: lote,
      KDFecha: fecha,
      KDExistenciaInicial: 0,
      KDCostoPromedio: 0,
      KDMes: mes,
      KDAno: ano,
      usuario,
    },
  });

  return kardexDet;
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

async function obtenerSiguienteOrgSecuencia(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<number> {
  const ultimoMovimiento = await tx.movkar.findFirst({
    where: { MVOrganizationId: organizationId },
    orderBy: { MVOrgSecuencia: "desc" },
  });

  return (ultimoMovimiento?.MVOrgSecuencia || 0) + 1;
}

async function obtenerSiguienteSecuencial(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<number> {
  const ultimoMovimiento = await tx.movkar.findFirst({
    where: { MVOrganizationId: organizationId },
    orderBy: { MVSecuencial: "desc" },
  });

  return (ultimoMovimiento?.MVSecuencial || 0) + 1;
}

async function actualizarKardexLote({
  tx,
  kardexLoteId,
  tipoMovimiento,
  cantidad,
  costoUltimo,
  costoPromedioCalculado,
  fechaMovimiento,
  preservarCostos = false,
}: {
  cantidad: number;
  costoPromedioCalculado: number;
  costoUltimo: number;
  fechaMovimiento?: Date;
  kardexLoteId: number;
  preservarCostos?: boolean;
  tipoMovimiento: number;
  tx: Prisma.TransactionClient;
}) {
  const kardexLote = await tx.kardexLote.findUnique({
    where: { KLId: kardexLoteId },
  });

  if (!kardexLote) {
    throw new EntityNotFoundError("Kardex lot not found");
  }

  const existenciaActual = Number(kardexLote.KLExistenciaFin);
  const entradasActuales = Number(kardexLote.KLEntradas);
  const salidasActuales = Number(kardexLote.KLSalidas);
  const valorEntradasActual = Number(kardexLote.KLValorEntradas);
  const valorSalidasActual = Number(kardexLote.KLValorSalidas);

  if (tipoMovimiento === 1) {
    // Entrada: costoUltimo = purchase price, costoPromedioCalculado = pre-calculated average
    const nuevaExistencia = existenciaActual + cantidad;
    const nuevoValorEntradas = valorEntradasActual + cantidad * costoUltimo;

    const nuevoValorCostoPromedio = nuevaExistencia * costoPromedioCalculado;
    const nuevoValorCostoUltimo = nuevaExistencia * costoUltimo;

    return await tx.kardexLote.update({
      where: { KLId: kardexLoteId },
      data: {
        KLExistenciaFin: nuevaExistencia,
        KLEntradas: entradasActuales + cantidad,
        KLValorEntradas: nuevoValorEntradas,
        ...(!preservarCostos && {
          KLCostoUltimo: costoUltimo,
          KLCostoPromedio: costoPromedioCalculado,
          KLValorCostoUltimo: nuevoValorCostoUltimo,
          KLValorCostoPromedio: nuevoValorCostoPromedio,
        }),
        ...(fechaMovimiento && { KLFechaUltimaEntrada: fechaMovimiento }),
      },
    });
  } else {
    // Salida: costoUltimo and costoPromedioCalculado from Kardex total
    const nuevaExistencia = existenciaActual - cantidad;
    const nuevoValorSalidas =
      valorSalidasActual + cantidad * costoPromedioCalculado;

    const nuevoValorCostoPromedio = nuevaExistencia * costoPromedioCalculado;
    const nuevoValorCostoUltimo = nuevaExistencia * costoUltimo;

    await tx.kardexLote.update({
      where: { KLId: kardexLoteId },
      data: {
        KLExistenciaFin: nuevaExistencia,
        KLSalidas: salidasActuales + cantidad,
        KLValorSalidas: nuevoValorSalidas,
        KLCostoUltimo: costoUltimo,
        KLCostoPromedio: costoPromedioCalculado,
        KLValorCostoUltimo: nuevoValorCostoUltimo,
        KLValorCostoPromedio: nuevoValorCostoPromedio,
      },
    });
  }
}

/** Pure formula: (total entries value - total exits value) / units, rounded to 2dp. */
const calcularCostoPromedio = (
  valorEntradas: number,
  valorSalidas: number,
  existencia: number,
): number =>
  existencia > 0
    ? Math.round(((valorEntradas - valorSalidas) / existencia) * 100) / 100
    : 0;

// Fetches current Kardex state and computes the new avg cost after adding a new entry.
// IMPORTANT: Only call when nuevoCostoPorUnidad > 0 — zero-cost entries use 0 directly.
async function calcularNuevoCostoPromedioEntrada(
  tx: Prisma.TransactionClient,
  kardexId: number,
  nuevaCantidad: number,
  nuevoCostoPorUnidad: number,
): Promise<number> {
  const kardex = await tx.kardex.findUnique({
    where: { KId: kardexId },
    select: {
      KExistenciaFin: true,
      KValorEntradas: true,
      KValorSalidas: true,
    },
  });

  if (!kardex) return nuevoCostoPorUnidad;

  const existenciaActual = Number(kardex.KExistenciaFin);
  const valorEntradasActual = Number(kardex.KValorEntradas);
  const valorSalidasActual = Number(kardex.KValorSalidas);

  const nuevaExistencia = existenciaActual + nuevaCantidad;
  const nuevoValorEntradas =
    valorEntradasActual + nuevaCantidad * nuevoCostoPorUnidad;

  return calcularCostoPromedio(
    nuevoValorEntradas,
    valorSalidasActual,
    nuevaExistencia,
  );
}

async function actualizarKardexPadre(
  tx: Prisma.TransactionClient,
  kardexId: number,
  costoUltimo?: number,
  costoPromedioCalculado?: number,
) {
  const [totales, kardexActual] = await Promise.all([
    tx.kardexLote.aggregate({
      where: { KLKardexId: kardexId },
      _sum: {
        KLExistenciaFin: true,
        KLEntradas: true,
        KLSalidas: true,
        KLValorEntradas: true,
        KLValorSalidas: true,
      },
    }),
    // Read current per-unit costs so we can always recompute the aggregated value fields,
    // even when costs are not being updated (e.g. exits, zero-cost entries)
    tx.kardex.findUnique({
      where: { KId: kardexId },
      select: { KCostoPromedio: true, KCostoUltimo: true },
    }),
  ]);

  const existenciaFinal = Number(totales._sum.KLExistenciaFin || 0);
  const costoPromedioEfectivo =
    costoPromedioCalculado ?? Number(kardexActual?.KCostoPromedio || 0);
  const costoUltimoEfectivo =
    costoUltimo ?? Number(kardexActual?.KCostoUltimo || 0);

  await tx.kardex.update({
    where: { KId: kardexId },
    data: {
      KExistenciaFin: existenciaFinal,
      KEntradas: totales._sum.KLEntradas || 0,
      KSalidas: totales._sum.KLSalidas || 0,
      KValorEntradas: totales._sum.KLValorEntradas || 0,
      KValorSalidas: totales._sum.KLValorSalidas || 0,
      // Only update per-unit costs when explicitly provided (entries only)
      ...(costoPromedioCalculado !== undefined && {
        KCostoPromedio: costoPromedioCalculado,
      }),
      ...(costoUltimo !== undefined && { KCostoUltimo: costoUltimo }),
      // Always recompute aggregated value fields = KExistenciaFin × per-unit cost
      KLValorCostoPromedio: costoPromedioEfectivo * existenciaFinal,
      KLValorCostoUltimo: costoUltimoEfectivo * existenciaFinal,
    },
  });
}

async function actualizarKardexDet(
  tx: Prisma.TransactionClient,
  kardexDetId: number,
  tipoMovimiento: number,
  cantidad: number,
  costo: number,
  preservarCostos = false,
) {
  const kardexDet = await tx.kardexDet.findUnique({
    where: { KDId: kardexDetId },
  });

  if (!kardexDet) {
    throw new EntityNotFoundError("Detailed kardex not found");
  }

  const existenciaActual = Number(kardexDet.KDExistenciaFin);
  const entradasActuales = Number(kardexDet.KDEntradas);
  const salidasActuales = Number(kardexDet.KDSalidas);
  const valorEntradasActual = Number(kardexDet.KDValorEntradas);
  const valorSalidasActual = Number(kardexDet.KDValorSalidas);

  if (tipoMovimiento === 1) {
    // Entrada (líneas 897-908 del COBOL)
    const nuevaExistencia = existenciaActual + cantidad;
    const nuevasEntradas = entradasActuales + cantidad;
    const nuevoValorEntradas = valorEntradasActual + cantidad * costo;

    await tx.kardexDet.update({
      where: { KDId: kardexDetId },
      data: {
        KDExistenciaFin: nuevaExistencia,
        KDEntradas: nuevasEntradas,
        KDValorEntradas: nuevoValorEntradas,
        ...(!preservarCostos && {
          KDCostoUltimo: costo,
          KDCostoPromedio: costo,
        }),
      },
    });
  } else {
    // Salida (líneas 910-920 del COBOL)
    const nuevaExistencia = existenciaActual - cantidad;
    const nuevasSalidas = salidasActuales + cantidad;
    const nuevoValorSalidas =
      valorSalidasActual + cantidad * Number(kardexDet.KDCostoPromedio);

    await tx.kardexDet.update({
      where: { KDId: kardexDetId },
      data: {
        KDExistenciaFin: nuevaExistencia,
        KDSalidas: nuevasSalidas,
        KDValorSalidas: nuevoValorSalidas,
      },
    });
  }
}

// ===============================================
// NUEVAS FUNCIONES PARA PROCESAR ENTRADAS Y SALIDAS
// ===============================================

async function procesarEntrada(
  tx: Prisma.TransactionClient,
  kardex: Kardex,
  data: CrearMovimientoDto & { MVLoteNroDocumento?: string },
  tipoMovimiento: Tmovkar,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  usuario: string,
  calcularCostoPromedio: boolean,
  isReturn: boolean,
  period: Period,
): Promise<Movkar> {
  // Validar que el lote esté presente para entradas
  if (!data.MVLote?.trim()) {
    throw new EntityValidationError("Lot identifier is required for entries");
  }

  let nroDocLote: string;
  if (isReturn) {
    const doc = data.MVLoteNroDocumento?.trim();
    if (!doc) {
      throw new EntityValidationError(
        "Return entry requires MVLoteNroDocumento",
      );
    }
    nroDocLote = doc;
  } else {
    nroDocLote = data.MVNroDocumento;
  }

  // 1. Crear o obtener KardexLote específico con el lote del usuario
  const kardexLote = await obtenerOCrearKardexLote(
    tx,
    kardex.KId,
    data.MVLote,
    nroDocLote,
    ciudadId,
    organizationId,
    invcaruniId,
    almacenId,
    usuario,
    data.MVFecha,
    period.mes,
    period.ano,
  );

  // 2. Obtener o crear KardexDet (por fecha)
  const kardexDet = await obtenerOCrearKardexDet(
    tx,
    kardexLote.KLId,
    organizationId,
    invcaruniId,
    almacenId,
    ciudadId,
    data.MVLote,
    data.MVFecha,
    usuario,
    period.mes,
    period.ano,
  );

  // 3. Costos de entrada:
  // - entradas normales: MVCostoPrecio (purchase cost)
  // - devoluciones: MVCostoSalida (historical inventory cost)
  const costoCompra = data.MVCostoPrecio ?? 0;
  const costoInventarioEntrada = isReturn
    ? (data.MVCostoSalida ?? 0)
    : costoCompra;
  const esEntradaCostoCero =
    data.MVEsCostoTemporalCero || costoInventarioEntrada === 0;

  let nuevoCostoPromedioCalculado = 0;
  if (calcularCostoPromedio && !esEntradaCostoCero) {
    nuevoCostoPromedioCalculado = await calcularNuevoCostoPromedioEntrada(
      tx,
      kardex.KId,
      data.MVCantidad,
      costoInventarioEntrada,
    );
  }

  // 4. Generar secuencias para el movimiento
  const siguienteOrgSecuencia = await obtenerSiguienteOrgSecuencia(
    tx,
    organizationId,
  );
  const siguienteSecuencial = await obtenerSiguienteSecuencial(
    tx,
    organizationId,
  );

  // 5. Crear el movimiento: MVCostoUltimo = purchase price, MVCostoPrecio = 0, MVCostoSalida = new average
  const nuevoMovimiento = await tx.movkar.create({
    data: {
      MVKardexDetId: kardexDet.KDId,
      MVCiudadId: ciudadId,
      MVTipoMovimientoId: data.MVTipoMovimientoId,
      MVLote: data.MVLote,
      MVLoteNroDocumento: data.MVLoteNroDocumento
        ? data.MVLoteNroDocumento
        : data.MVNroDocumento,
      MVAlmacenId: almacenId,
      MVInvcaruniId: invcaruniId,
      MVProveedorId: data.MVProveedorId,
      MVOrganizationId: organizationId,
      MVFecha: data.MVFecha,
      MVNroDocumento: data.MVNroDocumento,
      MVCantidad: data.MVCantidad,
      MVCostoUltimo: costoCompra,
      MVCostoPrecio: 0,
      MVCostoSalida: calcularCostoPromedio
        ? nuevoCostoPromedioCalculado
        : (data.MVCostoSalida ?? costoInventarioEntrada),
      MVDescuento: data.MVDescuento || 0,
      MVImpuesto: data.MVImpuesto || 0,
      MVOrgSecuencia: siguienteOrgSecuencia,
      MVSecuencial: siguienteSecuencial,
      MVEsCostoTemporalCero: data.MVEsCostoTemporalCero || false,
      usuario,
      creadoOModificado: new Date(),
    },
  });

  // 6. Actualizar toda la jerarquía de kardex (solo si afecta inventario)
  if (tipoMovimiento.TAfecta) {
    // Adjustments that don't recalculate avg cost still need cost fields written on
    // kardexLote/kardexDet (they start at 0). Use costoInventarioEntrada (= current avg)
    // as both costs so the lote/det records reflect the correct value.
    const esAjusteSinRecalculo =
      tipoMovimiento.TAjusteInventario && !calcularCostoPromedio;
    const costoParaKardexLoteDet = calcularCostoPromedio
      ? costoInventarioEntrada
      : (data.MVCostoSalida ?? costoInventarioEntrada);
    const costoPromedioParaLote = calcularCostoPromedio
      ? nuevoCostoPromedioCalculado
      : esAjusteSinRecalculo
        ? costoInventarioEntrada
        : 0;

    await actualizarKardexDet(
      tx,
      kardexDet.KDId,
      tipoMovimiento.TTipo,
      data.MVCantidad,
      costoParaKardexLoteDet,
      !calcularCostoPromedio && !esAjusteSinRecalculo,
    );

    await actualizarKardexLote({
      tx,
      kardexLoteId: kardexLote.KLId,
      tipoMovimiento: tipoMovimiento.TTipo,
      cantidad: data.MVCantidad,
      costoUltimo: costoParaKardexLoteDet,
      costoPromedioCalculado: costoPromedioParaLote,
      fechaMovimiento: data.MVFecha,
      preservarCostos: !calcularCostoPromedio && !esAjusteSinRecalculo,
    });

    if (calcularCostoPromedio) {
      await actualizarKardexPadre(
        tx,
        kardex.KId,
        esEntradaCostoCero ? undefined : costoInventarioEntrada,
        esEntradaCostoCero ? undefined : nuevoCostoPromedioCalculado,
      );
    } else {
      await actualizarKardexPadre(tx, kardex.KId);
    }
  }

  return nuevoMovimiento;
}

async function procesarSalida(
  tx: Prisma.TransactionClient,
  kardex: Kardex,
  data: CrearMovimientoDto,
  tipoMovimiento: Tmovkar,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  usuario: string,
  calcularCostoPromedio: boolean,
  costoPromedioKardex: number,
  costoUltimoKardex: number,
  period: Period,
): Promise<Movkar[]> {
  // 1. Decidir entre salida automática (FIFO) o manual
  if (tipoMovimiento.TAfecta) {
    let movimientosCreados: Movkar[];

    const isManualExit = data.modoSalida === "manual";
    const hasLotesManual = data.lotesManual && data.lotesManual.length > 0;
    const hasSingleLot =
      Boolean(data.MVLote?.trim()) &&
      typeof data.MVLoteNroDocumento === "string" &&
      data.MVLoteNroDocumento.trim().length > 0;

    let lotesManualToUse = data.lotesManual;
    if (isManualExit && !hasLotesManual && hasSingleLot) {
      const loteStr = data.MVLote?.trim();
      const nroDocStr = data.MVLoteNroDocumento?.trim();
      if (!loteStr || !nroDocStr) {
        throw new EntityValidationError(
          "Manual exit requires valid lot and document number",
        );
      }
      lotesManualToUse = [
        {
          lote: loteStr,
          nroDocumento: nroDocStr,
          cantidad: data.MVCantidad,
        },
      ];
    }

    if (isManualExit && lotesManualToUse && lotesManualToUse.length > 0) {
      movimientosCreados = await procesarSalidaManual(
        tx,
        kardex.KId,
        lotesManualToUse,
        data.MVNroDocumento,
        data.MVTipoMovimientoId,
        data.MVFecha,
        data.MVCostoPrecio || 0,
        data.MVCostoSalida || 0,
        data.MVDescuento || 0,
        data.MVImpuesto || 0,
        organizationId,
        invcaruniId,
        almacenId,
        ciudadId,
        data.MVProveedorId || null,
        data.MVClienteId || null,
        usuario,
        costoPromedioKardex,
        costoUltimoKardex,
        period,
      );
    } else {
      const existenciaTotal = Number(kardex.KExistenciaFin);

      if (existenciaTotal <= 0) {
        throw new EntityValidationError("Cannot make outputs with zero stock");
      }

      if (data.MVCantidad > existenciaTotal) {
        throw new EntityValidationError(
          "Insufficient stock in total inventory",
        );
      }

      movimientosCreados = await procesarSalidaFIFO(
        tx,
        kardex.KId,
        data.MVCantidad,
        data.MVNroDocumento,
        data.MVTipoMovimientoId,
        data.MVFecha,
        data.MVCostoPrecio || 0,
        data.MVCostoSalida || 0,
        data.MVDescuento || 0,
        data.MVImpuesto || 0,
        organizationId,
        invcaruniId,
        almacenId,
        ciudadId,
        data.MVProveedorId || null,
        data.MVClienteId || null,
        usuario,
        costoPromedioKardex,
        costoUltimoKardex,
        period,
      );
    }

    // 3. Actualizar Kardex padre (solo totales agregados; no actualizar costos en salidas)
    await actualizarKardexPadre(tx, kardex.KId);

    return movimientosCreados;
  }

  // Si no afecta inventario, crear un movimiento simple (similar a entrada pero sin actualizar inventario)
  return [
    await crearMovimientoSinAfectarInventario(
      tx,
      kardex,
      data,
      tipoMovimiento,
      organizationId,
      invcaruniId,
      almacenId,
      ciudadId,
      usuario,
      period,
    ),
  ];
}

async function crearMovimientoSinAfectarInventario(
  tx: Prisma.TransactionClient,
  kardex: Kardex,
  data: CrearMovimientoDto,
  _tipoMovimiento: Tmovkar,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  usuario: string,
  period: Period,
): Promise<Movkar> {
  // Validar que el lote esté presente para movimientos que no afectan inventario
  if (!data.MVLote?.trim()) {
    throw new EntityValidationError(
      "Lot identifier is required for this type of movement",
    );
  }

  // Para movimientos que no afectan inventario, crear con el lote y documento del usuario
  // TODO: Arreglar, traer lot y nro document de frontend selector de lotes en vez de nro documento del movimiento
  const kardexLote = await obtenerOCrearKardexLote(
    tx,
    kardex.KId,
    data.MVLote,
    data.MVNroDocumento.toString(),
    ciudadId,
    organizationId,
    invcaruniId,
    almacenId,
    usuario,
    data.MVFecha,
    period.mes,
    period.ano,
  );

  const kardexDet = await obtenerOCrearKardexDet(
    tx,
    kardexLote.KLId,
    organizationId,
    invcaruniId,
    almacenId,
    ciudadId,
    data.MVLote,
    data.MVFecha,
    usuario,
    period.mes,
    period.ano,
  );

  const siguienteOrgSecuencia = await obtenerSiguienteOrgSecuencia(
    tx,
    organizationId,
  );
  const siguienteSecuencial = await obtenerSiguienteSecuencial(
    tx,
    organizationId,
  );

  return await tx.movkar.create({
    data: {
      MVKardexDetId: kardexDet.KDId,
      MVTipoMovimientoId: data.MVTipoMovimientoId,
      MVLote: data.MVLote,
      MVLoteNroDocumento: kardexLote.KLNroDocumento,
      MVClienteId: data.MVClienteId,
      MVAlmacenId: almacenId,
      MVInvcaruniId: invcaruniId,
      MVOrganizationId: organizationId,
      MVFecha: data.MVFecha,
      MVNroDocumento: data.MVNroDocumento,
      MVCantidad: data.MVCantidad,
      MVCostoPrecio: data.MVCostoPrecio ?? 0,
      MVCostoSalida: data.MVCostoSalida ?? 0,
      MVCostoUltimo: data.MVCostoPrecio ?? 0,
      MVDescuento: data.MVDescuento || 0,
      MVImpuesto: data.MVImpuesto || 0,
      MVOrgSecuencia: siguienteOrgSecuencia,
      MVCiudadId: ciudadId,
      MVSecuencial: siguienteSecuencial,
      MVEsCostoTemporalCero: data.MVEsCostoTemporalCero || false,
      creadoOModificado: new Date(),
      usuario,
    },
  });
}

// ===============================================
// NUEVAS FUNCIONES PARA LÓGICA FIFO Y MANUAL
// ===============================================

async function buscarLotesConInventario(
  tx: Prisma.TransactionClient,
  kardexId: number,
): Promise<KardexLote[]> {
  // Ordenados por fecha de última entrada (FIFO - más antiguo primero)
  const lotesConInventario = await tx.kardexLote.findMany({
    where: {
      KLKardexId: kardexId,
      KLExistenciaFin: {
        gt: 0, // Solo lotes con inventario disponible
      },
    },
    orderBy: [
      {
        KLFechaUltimaEntrada: "asc", // FIFO: más antiguo primero
      },
      {
        KLId: "asc",
      },
    ],
  });

  return lotesConInventario;
}

/**
 * Obtiene la distribución de lotes para una salida usando FIFO
 * SIN crear movimientos de inventario. Solo retorna la propuesta de distribución.
 * @param tx - Cliente de transacción
 * @param organizationId - ID de la organización
 * @param invcaruniId - ID del producto
 * @param almacenId - ID del almacén
 * @param cantidadSolicitada - Cantidad total a distribuir
 * @param skipLotes - Lotes a omitir en esta distribución (mismo producto/kardex; no mezclar SKUs distintos)
 * @param excludeDispatchOrderGId - Optional dispatch order header ID; reservations from this order are excluded when computing available stock
 * @returns Array de objetos con { lote, cantidad } indicando cómo se distribuiría la cantidad
 */
export async function obtenerLotesParaSalida(
  tx: Prisma.TransactionClient,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  cantidadSolicitada: number,
  skipLotes?: { lote: string; nroDocumento: string }[],
  excludeDispatchOrderGId?: number,
): Promise<{ cantidad: number; lote: string; nroDocumento: string }[]> {
  // 1. Obtener o crear kardex padre
  const kardex = await tx.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
    },
  });

  if (!kardex) {
    throw new EntityNotFoundError("Kardex record not found for this product");
  }

  // 2. Validar existencia física total
  const existenciaTotal = Number(kardex.KExistenciaFin);
  if (existenciaTotal <= 0) {
    throw new EntityValidationError("Cannot make outputs with zero stock");
  }

  // 3. Buscar lotes con inventario disponible (ordenados FIFO)
  let lotesDisponibles = await buscarLotesConInventario(tx, kardex.KId);

  if (skipLotes && skipLotes.length > 0) {
    lotesDisponibles = lotesDisponibles.filter(
      (lote) =>
        !skipLotes.some(
          (skip) =>
            skip.lote === lote.KLLote &&
            skip.nroDocumento === lote.KLNroDocumento,
        ),
    );
  }

  if (lotesDisponibles.length === 0) {
    throw new EntityValidationError("No lots with available inventory");
  }

  // 3.5. Validar existencia disponible total (física - reservada)
  let totalDisponible = 0;
  let totalFisicoEnLotes = 0;
  let totalReservadoEnLotes = 0;
  for (const lote of lotesDisponibles) {
    const reservedQty = await getReservedQuantityByLote(
      lote.KLId,
      organizationId,
      tx,
      excludeDispatchOrderGId,
    );
    const fisico = Number(lote.KLExistenciaFin);
    totalFisicoEnLotes += fisico;
    totalReservadoEnLotes += reservedQty;
    const existenciaDisponible = fisico - reservedQty;
    if (existenciaDisponible > 0) {
      totalDisponible += existenciaDisponible;
    }
  }

  // if (totalDisponible <= 0) {
  //   throw new EntityValidationError(
  //     "Cannot make outputs: all stock is reserved or unavailable",
  //   );
  // }

  if (cantidadSolicitada > totalDisponible) {
    const reservedNote =
      totalReservadoEnLotes > 0
        ? ` (${totalReservadoEnLotes} reserved for other orders)`
        : "";
    throw new InsufficientStockError(
      `Not enough stock for this item. Available: ${totalDisponible}${reservedNote}.`,
    );
  }

  // 4. Distribuir cantidad entre lotes en orden FIFO (usando disponible = físico - reservado)
  const distribucion: {
    cantidad: number;
    lote: string;
    nroDocumento: string;
  }[] = [];
  let cantidadRestante = cantidadSolicitada;

  for (const lote of lotesDisponibles) {
    if (cantidadRestante <= 0) break;

    const reservedQty = await getReservedQuantityByLote(
      lote.KLId,
      organizationId,
      tx,
      excludeDispatchOrderGId,
    );
    const existenciaDisponible = Number(lote.KLExistenciaFin) - reservedQty;
    if (existenciaDisponible <= 0) continue; // Lot fully reserved, skip

    const cantidadADescontar = Math.min(cantidadRestante, existenciaDisponible);

    distribucion.push({
      lote: lote.KLLote,
      nroDocumento: lote.KLNroDocumento,
      cantidad: cantidadADescontar,
    });

    cantidadRestante -= cantidadADescontar;
  }

  // 5. Verificar que se pudo completar toda la cantidad solicitada
  if (cantidadRestante > 0) {
    throw new InsufficientStockError(
      `Not enough stock for this item. Shortage: ${cantidadRestante}.`,
    );
  }

  return distribucion;
}

async function procesarSalidaManual(
  tx: Prisma.TransactionClient,
  kardexId: number,
  lotesManual: { cantidad: number; lote: string; nroDocumento: string }[],
  nroDocumento: string,
  tipoMovimientoId: number,
  fecha: Date,
  costoPrecio: number,
  costoSalida: number,
  descuento: number,
  impuesto: number,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  proveedorId: null | number,
  clienteId: null | number,
  usuario: string,
  costoPromedioKardex: number,
  costoUltimoKardex: number,
  period: Period,
): Promise<Movkar[]> {
  const movimientosCreados: Movkar[] = [];

  for (const loteEspecificado of lotesManual) {
    const kardexLote = await tx.kardexLote.findFirst({
      where: {
        KLKardexId: kardexId,
        KLLote: loteEspecificado.lote,
        KLNroDocumento: loteEspecificado.nroDocumento,
        KLExistenciaFin: {
          gt: 0,
        },
      },
    });

    if (!kardexLote) {
      throw new EntityNotFoundError(
        `Lot ${loteEspecificado.lote} (Doc: ${loteEspecificado.nroDocumento}) not found or has no available inventory`,
      );
    }

    const existenciaLote = Number(kardexLote.KLExistenciaFin);
    if (loteEspecificado.cantidad > existenciaLote) {
      throw new EntityValidationError(
        `Lot ${loteEspecificado.lote} (Doc: ${loteEspecificado.nroDocumento}) only has ${existenciaLote} units available.`,
      );
    }

    const movimiento = await crearMovimientoPorLote(
      tx,
      kardexLote,
      loteEspecificado.cantidad,
      nroDocumento,
      tipoMovimientoId,
      fecha,
      costoPrecio,
      costoSalida,
      costoUltimoKardex,
      descuento,
      impuesto,
      organizationId,
      invcaruniId,
      almacenId,
      ciudadId,
      proveedorId,
      clienteId,
      usuario,
      period,
    );

    movimientosCreados.push(movimiento);
  }

  return movimientosCreados;
}

async function procesarSalidaFIFO(
  tx: Prisma.TransactionClient,
  kardexId: number,
  cantidadSolicitada: number,
  nroDocumento: string,
  tipoMovimientoId: number,
  fecha: Date,
  costoPrecio: number,
  costoSalida: number,
  descuento: number,
  impuesto: number,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  proveedorId: null | number,
  clienteId: null | number,
  usuario: string,
  costoPromedioKardex: number,
  costoUltimoKardex: number,
  period: Period,
): Promise<Movkar[]> {
  const lotesDisponibles = await buscarLotesConInventario(tx, kardexId);

  if (lotesDisponibles.length === 0) {
    throw new EntityValidationError("No lots with available inventory");
  }

  const movimientosCreados: Movkar[] = [];
  let cantidadRestante = cantidadSolicitada;

  for (const lote of lotesDisponibles) {
    if (cantidadRestante <= 0) break;

    const existenciaLote = Number(lote.KLExistenciaFin);
    const cantidadADescontar = Math.min(cantidadRestante, existenciaLote);

    const movimiento = await crearMovimientoPorLote(
      tx,
      lote,
      cantidadADescontar,
      nroDocumento,
      tipoMovimientoId,
      fecha,
      costoPrecio,
      costoSalida,
      costoUltimoKardex,
      descuento,
      impuesto,
      organizationId,
      invcaruniId,
      almacenId,
      ciudadId,
      proveedorId,
      clienteId,
      usuario,
      period,
    );

    movimientosCreados.push(movimiento);
    cantidadRestante -= cantidadADescontar;
  }

  if (cantidadRestante > 0) {
    throw new EntityValidationError(
      `Insufficient inventory. Shortage: ${cantidadRestante}`,
    );
  }

  return movimientosCreados;
}

// ===============================================
// FUNCIONES PARA ACTUALIZACIÓN DE COSTO CERO
// ===============================================

async function validarActualizacionSecuencial(
  tx: Prisma.TransactionClient,
  movimientoId: number,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  fechaMovimiento: Date,
): Promise<void> {
  // Buscar todas las entradas con costo temporal cero anteriores a este movimiento
  // en el mismo producto/almacén
  const entradasAnterioresPendientes = await tx.movkar.findMany({
    where: {
      MVOrganizationId: organizationId,
      MVInvcaruniId: invcaruniId,
      MVAlmacenId: almacenId,
      MVEsCostoTemporalCero: true,
      MVFecha: {
        lt: fechaMovimiento, // Anteriores a la fecha del movimiento
      },
      MVId: {
        not: movimientoId, // Excluir el movimiento actual
      },
      tmovkar: {
        TTipo: 1, // Solo entradas
      },
    },
    orderBy: {
      MVFecha: "asc",
    },
    select: {
      MVId: true,
      MVFecha: true,
      MVSecuencial: true,
    },
  });

  if (entradasAnterioresPendientes.length > 0) {
    const primeraEntradaPendiente = entradasAnterioresPendientes[0];
    const fechaFormateada =
      primeraEntradaPendiente?.MVFecha.toLocaleDateString("en-US");
    throw new EntityValidationError(
      `You must update the entry from ${fechaFormateada} (sequential #${primeraEntradaPendiente?.MVSecuencial}) before updating this one`,
    );
  }
}

async function crearMovimientoPorLote(
  tx: Prisma.TransactionClient,
  kardexLote: KardexLote,
  cantidad: number,
  nroDocumento: string,
  tipoMovimientoId: number,
  fecha: Date,
  costoPrecio: number,
  costoSalida: number,
  costoUltimoKardex: number,
  descuento: number,
  impuesto: number,
  organizationId: string,
  invcaruniId: number,
  almacenId: number,
  ciudadId: number,
  proveedorId: null | number,
  clienteId: null | number,
  usuario: string,
  period: Period,
): Promise<Movkar> {
  const kardexDet = await obtenerOCrearKardexDet(
    tx,
    kardexLote.KLId,
    organizationId,
    invcaruniId,
    almacenId,
    ciudadId,
    kardexLote.KLLote,
    fecha,
    usuario,
    period.mes,
    period.ano,
  );

  const siguienteOrgSecuencia = await obtenerSiguienteOrgSecuencia(
    tx,
    organizationId,
  );
  const siguienteSecuencial = await obtenerSiguienteSecuencial(
    tx,
    organizationId,
  );

  const nuevoMovimiento = await tx.movkar.create({
    data: {
      MVKardexDetId: kardexDet.KDId,
      MVTipoMovimientoId: tipoMovimientoId,
      MVLote: kardexLote.KLLote,
      MVLoteNroDocumento: kardexLote.KLNroDocumento,
      MVProveedorId: proveedorId,
      MVClienteId: clienteId,
      MVAlmacenId: almacenId,
      MVInvcaruniId: invcaruniId,
      MVOrganizationId: organizationId,
      MVFecha: fecha,
      MVNroDocumento: nroDocumento,
      MVCantidad: cantidad,
      MVCostoPrecio: costoPrecio,
      MVCostoSalida: costoSalida,
      MVCostoUltimo: costoUltimoKardex,
      MVDescuento: descuento,
      MVImpuesto: impuesto,
      MVOrgSecuencia: siguienteOrgSecuencia,
      MVCiudadId: ciudadId,
      MVSecuencial: siguienteSecuencial,
      usuario,
      creadoOModificado: new Date(),
    },
  });

  await actualizarKardexDet(tx, kardexDet.KDId, 2, cantidad, costoSalida);

  await actualizarKardexLote({
    tx,
    kardexLoteId: kardexLote.KLId,
    tipoMovimiento: 2,
    cantidad: cantidad,
    costoUltimo: costoUltimoKardex,
    costoPromedioCalculado: costoSalida,
  });

  return nuevoMovimiento;
}

export async function actualizarCostoEntradaCero(
  organizationId: string,
  movimientoId: number,
  nuevoCosto: number,
) {
  return prisma.$transaction(async (tx) => {
    // ========================================
    // PASO 1: VALIDACIONES
    // ========================================

    const movimiento = await tx.movkar.findUnique({
      where: { MVId: movimientoId },
      include: {
        tmovkar: true,
        kardexDet: {
          include: {
            kardexLote: {
              include: { kardex: true },
            },
          },
        },
      },
    });

    if (!movimiento) {
      throw new EntityNotFoundError("Movement not found");
    }

    if (movimiento.tmovkar.TTipo !== 1) {
      throw new EntityValidationError("Only entries can be updated");
    }

    if (!movimiento.MVEsCostoTemporalCero) {
      throw new EntityValidationError(
        "This movement is not a temporary zero cost",
      );
    }

    if (Number(movimiento.MVCostoSalida) !== 0) {
      throw new EntityValidationError("The movement must have cost 0");
    }

    // Validar orden cronológico (función existente)
    await validarActualizacionSecuencial(
      tx,
      movimientoId,
      organizationId,
      movimiento.MVInvcaruniId,
      movimiento.MVAlmacenId,
      movimiento.MVFecha,
    );

    // ========================================
    // PASO 2: OBTENER ESTADO ACTUAL DEL KARDEX PADRE
    // ========================================

    const kardexPadre = movimiento.kardexDet.kardexLote.kardex;

    const valorEntradasActual = Number(kardexPadre.KValorEntradas);
    const valorSalidasActual = Number(kardexPadre.KValorSalidas);
    const existenciaActual = Number(kardexPadre.KExistenciaFin);

    // ========================================
    // PASO 3: BUSCAR SALIDAS POSTERIORES
    // ========================================

    const salidasPosteriores = await tx.movkar.findMany({
      where: {
        MVOrganizationId: organizationId,
        MVInvcaruniId: movimiento.MVInvcaruniId,
        MVAlmacenId: movimiento.MVAlmacenId,
        MVFecha: {
          gte: movimiento.MVFecha,
        },
        MVId: {
          not: movimientoId,
        },
        tmovkar: {
          TTipo: 2, // Solo salidas
        },
      },
      include: {
        kardexDet: {
          include: {
            kardexLote: true,
          },
        },
      },
      orderBy: {
        MVFecha: "asc",
      },
    });

    // ========================================
    // PASO 4: CALCULAR VALORES Y CANTIDADES DE SALIDAS POSTERIORES
    // ========================================

    let valorSalidasPosteriores = 0;
    let cantidadSalidasPosteriores = 0;

    for (const salida of salidasPosteriores) {
      const cantidad = Number(salida.MVCantidad);
      const costo = Number(salida.MVCostoSalida);
      const valorSalida = cantidad * costo;

      valorSalidasPosteriores += valorSalida;
      cantidadSalidasPosteriores += cantidad;
    }

    // ========================================
    // PASO 5: CALCULAR ESTADO "JUSTO DESPUÉS DE LA ENTRADA"
    // ========================================

    // Restar salidas posteriores del kardex padre actual
    const valorSalidasHastaEntrada =
      valorSalidasActual - valorSalidasPosteriores;
    const existenciasConEntrada = existenciaActual + cantidadSalidasPosteriores;

    // Añadir el valor de la entrada actualizada
    const cantidadEntrada = Number(movimiento.MVCantidad);
    const valorEntradasConNuevoCosto =
      valorEntradasActual + cantidadEntrada * nuevoCosto;

    // ========================================
    // PASO 6: CALCULAR NUEVO COSTO PROMEDIO PONDERADO
    // ========================================

    const nuevoCostoPromedioPonderado = calcularCostoPromedio(
      valorEntradasConNuevoCosto,
      valorSalidasHastaEntrada,
      existenciasConEntrada,
    );

    // ========================================
    // PASO 7: ACTUALIZAR EL MOVIMIENTO DE ENTRADA
    // ========================================

    await tx.movkar.update({
      where: { MVId: movimientoId },
      data: {
        MVCostoUltimo: nuevoCosto,
        MVCostoSalida: nuevoCostoPromedioPonderado,
        MVEsCostoTemporalCero: false,
      },
    });

    // ========================================
    // PASO 8: ACTUALIZAR KARDEX DETALLADO
    // ========================================

    const kardexDet = movimiento.kardexDet;
    const nuevoValorEntradasDet =
      Number(kardexDet.KDValorEntradas) + cantidadEntrada * nuevoCosto;

    await tx.kardexDet.update({
      where: { KDId: kardexDet.KDId },
      data: {
        KDCostoPromedio: nuevoCostoPromedioPonderado,
        KDValorEntradas: nuevoValorEntradasDet,
      },
    });

    // ========================================
    // PASO 9: ACTUALIZAR KARDEX LOTE
    // ========================================

    const kardexLote = kardexDet.kardexLote;
    const existenciaLote = Number(kardexLote.KLExistenciaFin);
    const nuevoValorEntradasLote =
      Number(kardexLote.KLValorEntradas) + cantidadEntrada * nuevoCosto;

    await tx.kardexLote.update({
      where: { KLId: kardexLote.KLId },
      data: {
        KLCostoPromedio: nuevoCostoPromedioPonderado,
        KLValorEntradas: nuevoValorEntradasLote,
        KLValorCostoPromedio: existenciaLote * nuevoCostoPromedioPonderado,
      },
    });

    // ========================================
    // PASO 10: ACTUALIZAR SALIDAS POSTERIORES (coste promedio por salida, cronológico)
    // ========================================

    let ajusteTotalValorSalidas = 0;
    let valorSalidasAcumulado = valorSalidasHastaEntrada;
    let existenciaRestante = existenciasConEntrada;
    const dispatchRowsByKey = new Map<string, { DOUId: number }[]>();
    const facturaRowsByKey = new Map<string, { FUId: number }[]>();
    const dispatchCursorByKey = new Map<string, number>();
    const facturaCursorByKey = new Map<string, number>();

    const nroDocsDispatch = Array.from(
      new Set(
        salidasPosteriores
          .map((s) => Number.parseInt(s.MVNroDocumento, 10))
          .filter((n) => !Number.isNaN(n)),
      ),
    );

    if (nroDocsDispatch.length > 0) {
      const dispatchCandidates = await tx.dispatchOrderU.findMany({
        where: {
          DOUOrganizationId: organizationId,
          DOUNro: { in: nroDocsDispatch },
        },
        select: {
          DOUId: true,
          DOUNro: true,
          DOUInvcaruniId: true,
          DOULote: true,
          DOUNroDocumento: true,
        },
        orderBy: { DOUId: "asc" },
      });

      for (const row of dispatchCandidates) {
        const key = `${row.DOUNro}-${row.DOUInvcaruniId}-${row.DOULote}-${row.DOUNroDocumento}`;
        const rows = dispatchRowsByKey.get(key) ?? [];
        rows.push({ DOUId: row.DOUId });
        dispatchRowsByKey.set(key, rows);
      }

      const facturaCandidates = await tx.facturau.findMany({
        where: {
          FUOrganizationId: organizationId,
          FUNro: { in: nroDocsDispatch },
          facturag: { FGFacturaDeSaldo: false },
        },
        select: {
          FUId: true,
          FUNro: true,
          FUInvcaruniId: true,
          FULote: true,
          FULoteNroDocumento: true,
        },
        orderBy: { FUId: "asc" },
      });

      for (const row of facturaCandidates) {
        const key = `${row.FUNro}-${row.FUInvcaruniId}-${row.FULote}-${row.FULoteNroDocumento}`;
        const rows = facturaRowsByKey.get(key) ?? [];
        rows.push({ FUId: row.FUId });
        facturaRowsByKey.set(key, rows);
      }
    }

    for (const salida of salidasPosteriores) {
      const cantidadSalida = Number(salida.MVCantidad);
      const costoAnterior = Number(salida.MVCostoSalida);
      const costoPromedioParaEstaSalida = calcularCostoPromedio(
        valorEntradasConNuevoCosto,
        valorSalidasAcumulado,
        existenciaRestante,
      );
      const ajusteValorSalida =
        cantidadSalida * (costoPromedioParaEstaSalida - costoAnterior);

      ajusteTotalValorSalidas += ajusteValorSalida;
      valorSalidasAcumulado += cantidadSalida * costoPromedioParaEstaSalida;
      existenciaRestante -= cantidadSalida;

      // 10.1 Actualizar movimiento (costo promedio calculado para esta salida, costo último = nuevo precio dado)
      await tx.movkar.update({
        where: { MVId: salida.MVId },
        data: {
          MVCostoSalida: costoPromedioParaEstaSalida,
          MVCostoUltimo: nuevoCosto,
        },
      });

      // 10.2 Actualizar KardexDet
      const kardexDetSalida = salida.kardexDet;
      const nuevoValorSalidasDet =
        Number(kardexDetSalida.KDValorSalidas) + ajusteValorSalida;

      await tx.kardexDet.update({
        where: { KDId: kardexDetSalida.KDId },
        data: {
          KDValorSalidas: nuevoValorSalidasDet,
          KDCostoPromedio: costoPromedioParaEstaSalida,
        },
      });

      // 10.3 Actualizar KardexLote
      const kardexLoteSalida = kardexDetSalida.kardexLote;
      const nuevoValorSalidasLote =
        Number(kardexLoteSalida.KLValorSalidas) + ajusteValorSalida;
      const existenciaLoteSalida = Number(kardexLoteSalida.KLExistenciaFin);

      await tx.kardexLote.update({
        where: { KLId: kardexLoteSalida.KLId },
        data: {
          KLValorSalidas: nuevoValorSalidasLote,
          KLCostoPromedio: costoPromedioParaEstaSalida,
          KLValorCostoPromedio:
            existenciaLoteSalida * costoPromedioParaEstaSalida,
        },
      });

      // 10.4 Actualizar DispatchOrderU vinculado a esta salida (mismo documento/producto/lote)
      const nroDocDispatch = parseInt(salida.MVNroDocumento, 10);
      if (!Number.isNaN(nroDocDispatch)) {
        const dispatchKey = `${nroDocDispatch}-${salida.MVInvcaruniId}-${salida.MVLote}-${salida.MVLoteNroDocumento}`;
        const dispatchRows = dispatchRowsByKey.get(dispatchKey) ?? [];
        const dispatchCursor = dispatchCursorByKey.get(dispatchKey) ?? 0;
        const dispatchTarget = dispatchRows[dispatchCursor];
        if (dispatchTarget) {
          await tx.dispatchOrderU.update({
            where: { DOUId: dispatchTarget.DOUId },
            data: { DOUCostoPromedio: costoPromedioParaEstaSalida },
          });
          dispatchCursorByKey.set(dispatchKey, dispatchCursor + 1);
        }

        // 10.5 Actualizar Facturau de facturas por despacho (no balance-invoices)
        const facturaKey = `${nroDocDispatch}-${salida.MVInvcaruniId}-${salida.MVLote}-${salida.MVLoteNroDocumento}`;
        const facturaRows = facturaRowsByKey.get(facturaKey) ?? [];
        const facturaCursor = facturaCursorByKey.get(facturaKey) ?? 0;
        const facturaTarget = facturaRows[facturaCursor];
        if (facturaTarget) {
          await tx.facturau.update({
            where: { FUId: facturaTarget.FUId },
            data: { FUCostoPromedio: costoPromedioParaEstaSalida },
          });
          facturaCursorByKey.set(facturaKey, facturaCursor + 1);
        }
      }
    }

    // ========================================
    // PASO 11: ACTUALIZAR KARDEX PADRE CON VALORES FINALES
    // ========================================

    const valorEntradasFinal = valorEntradasConNuevoCosto;
    const valorSalidasFinal = valorSalidasActual + ajusteTotalValorSalidas;
    const existenciaFinal = existenciaActual;
    const costoPromedioFinal = calcularCostoPromedio(
      valorEntradasFinal,
      valorSalidasFinal,
      existenciaFinal,
    );

    await tx.kardex.update({
      where: { KId: kardexPadre.KId },
      data: {
        KValorEntradas: valorEntradasFinal,
        KValorSalidas: valorSalidasFinal,
        KCostoPromedio: costoPromedioFinal,
        KLValorCostoPromedio: existenciaFinal * costoPromedioFinal,
      },
    });

    // ⬇️ AGREGAR ESTE RETURN
    return {
      movimientoActualizado: movimiento.MVOrgSecuencia,
      nuevoCosto,
      nuevoCostoPromedioPonderado: costoPromedioFinal,
      salidasActualizadas: salidasPosteriores.length,
    };
  });
}
