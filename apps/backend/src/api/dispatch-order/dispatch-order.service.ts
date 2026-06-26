/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {
  DispatchOrderU,
  DocumentType,
  EstadoDispatchOrder,
  EstadoReserva,
  Invcaruni,
  Prisma,
  prisma,
  TipoPropositoMovkar,
} from "@repo/db";

import type {
  ActualizarDispatchOrderDto,
  CrearDispatchOrderHeaderDto,
  DispatchOrderItemDto,
  EmitirDispatchOrderDto,
  ListDispatchOrdersQuery,
} from "./dispatch-order.validator.js";

import {
  EntityNotFoundError,
  EntityValidationError,
  InsufficientStockError,
  InternalError,
} from "../../errors/EntityErrors.js";
import {
  sendDispatchOrderDispatchedClientEmailBatch,
  sendDispatchOrderEmailBatch,
} from "../../lib/email.service.js";
import {
  emailDispatchDispatchedQueue,
  outboxProcessQueue,
} from "../../queue/queues.js";
import {
  filterPendingEmails,
  normalizeDispatchRecipientEmails,
} from "../../workers/outbox-worker.helpers.js";
import {
  deleteS3ObjectsBestEffort,
  dispatchOrderEmittedAutoPdfWhere,
  findLatestDispatchOrderEmittedAutoPdf,
  getObjectBuffer,
  putDispatchOrderEmittedAutoPdfBufferToS3,
  uploadDocument,
} from "../documents/documents.service.js";
import {
  crearMovimientoConTx,
  obtenerCostoPromedioProducto,
  obtenerLotesParaSalida,
} from "../movkar/movkar.service.js";
import {
  assertPriorPeriodsClosed,
  periodFromDate,
} from "../period/period.service.js";
import {
  consumeReservationsForDispatchOrder,
  getReservedQuantityByLote,
} from "../reservations/reservations.service.js";
import {
  mapDispatchOrderGToApi,
  mapDispatchOrderUListToApi,
} from "./dispatch-order.mapper.js";
import {
  calculateRequestedTotalForLot,
  sumReturnsByOriginalItemId,
} from "./dispatch-order.utils.js";
import { generateDispatchOrderPDF } from "./pdf/dispatch-order-pdf.service.js";

// ===== INTERFACES =====

interface CalculatedTotals {
  dispatchOrderU: {
    cantidad: number;
    descuento: number;
    precioBruto: number;
    precioNeto: number;
    precioUnitario: number;
    productoId: number;
    tieneIva: boolean;
  }[];
  valorTotalBruto: number;
  valorTotalNeto: number;
}

interface ListDispatchOrdersOptions {
  clienteId?: number;
  estado?: EstadoDispatchOrder;
  fechaDesde?: Date;
  fechaHasta?: Date;
  limit: number;
  organizationId: string;
  page: number;
  search?: string;
  vendedorId?: number;
}
// ===== SERVICIOS DE LISTADO Y CONSULTA =====

/**
 * Lista todas las dispatch orders con paginación y filtros
 */
export const listDispatchOrders = async (
  options: ListDispatchOrdersOptions,
) => {
  const {
    page,
    limit,
    search,
    estado,
    clienteId,
    vendedorId,
    fechaDesde,
    fechaHasta,
    organizationId,
  } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.DispatchOrderGWhereInput = {
    DOGOrganizationId: organizationId,
  };

  if (estado) {
    where.DOGEstado = estado;
  }

  if (clienteId) {
    where.DOGClienteId = clienteId;
  }

  if (vendedorId) {
    where.DOGVendedorId = vendedorId;
  }

  if (fechaDesde || fechaHasta) {
    where.DOGFechaCreado = {};
    if (fechaDesde) {
      where.DOGFechaCreado.gte = fechaDesde;
    }
    if (fechaHasta) {
      where.DOGFechaCreado.lte = fechaHasta;
    }
  }

  if (search) {
    const searchNumber = parseInt(search);
    const isNumber = !isNaN(searchNumber);
    where.OR = [
      { DOGPurchaseOrder: { contains: search, mode: "insensitive" } },
      { cltemae: { CRazonSocial: { contains: search, mode: "insensitive" } } },
      {
        vendedor: { VNombre: { contains: search, mode: "insensitive" } },
      },
      ...(isNumber ? [{ DOGNro: searchNumber }] : []),
    ];
  }

  const [dispatchOrders, total] = await prisma.$transaction([
    prisma.dispatchOrderG.findMany({
      where,
      skip,
      take: limit,
      orderBy: { DOGFechaCreado: "desc" },
      include: {
        cltemae: true,
        vendedor: true,
        dispatchOrderU: {
          include: {
            invcaruni: true,
          },
          orderBy: [
            { invcaruni: { CKDescripcion: "asc" } },
            { DOULote: "asc" },
            { DOUId: "asc" },
          ],
        },
      },
    }),
    prisma.dispatchOrderG.count({ where }),
  ]);

  return {
    dispatchOrders: dispatchOrders.map(mapDispatchOrderGToApi),
    total,
  };
};

/**
 * Obtiene una dispatch order por su secuencia en la organización
 * Resta las cantidades de devoluciones de los items originales para evitar duplicados
 */
export const getDispatchOrderBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  // 1. Obtener dispatch order con todos los items
  const dispatchOrder = await prisma.dispatchOrderG.findUnique({
    where: {
      DOGOrganizationId_DOGOrgSecuencia: {
        DOGOrganizationId: organizationId,
        DOGOrgSecuencia: orgSecuencia,
      },
    },
    include: {
      cltemae: true,
      vendedor: true,
      ciudad: {
        include: {
          estado: {
            include: {
              pais: true,
            },
          },
        },
      },
      dispatchOrderU: {
        include: {
          tipoMovimiento: true,
          invcaruni: {
            include: {
              grupo: true,
              unidadDeMedida: true,
            },
          },
        },
        orderBy: [
          { invcaruni: { CKDescripcion: "asc" } },
          { DOULote: "asc" },
          { DOUId: "asc" },
        ],
      },
    },
  });

  if (!dispatchOrder) {
    throw new EntityNotFoundError("Dispatch order not found");
  }

  // 3. Separar items originales (salida) de devoluciones (entrada)
  const itemsOriginales = dispatchOrder.dispatchOrderU.filter(
    (item) => item.tipoMovimiento.TTipo === 2,
  );
  const itemsDevolucion = dispatchOrder.dispatchOrderU.filter(
    (item) =>
      item.tipoMovimiento.TProposito ===
      TipoPropositoMovkar.DISPATCH_ORDER_DEVOLUCION,
  );

  const originalsConLote = itemsOriginales
    .filter((item) => item.DOULote != null && item.DOUNroDocumento != null)
    .map((item) => ({
      ...item,
      DOUCantidad: Number(item.DOUCantidad),
      DOUVrBruto: Number(item.DOUVrBruto),
      DOUVrNeto: Number(item.DOUVrNeto),
    }));

  const returnedByOriginalId = sumReturnsByOriginalItemId(
    originalsConLote.map((item) => ({
      DOUId: item.DOUId,
      DOUInvcaruniId: item.DOUInvcaruniId,
      DOULote: item.DOULote,
      DOUNroDocumento: item.DOUNroDocumento,
      DOUCantidad: item.DOUCantidad,
    })),
    itemsDevolucion
      .filter((item) => item.DOULote != null && item.DOUNroDocumento != null)
      .map((item) => ({
        DOUOriginalItemId: item.DOUOriginalItemId ?? null,
        DOUInvcaruniId: item.DOUInvcaruniId,
        DOULote: item.DOULote,
        DOUNroDocumento: item.DOUNroDocumento,
        DOUCantidad: Number(item.DOUCantidad),
      })),
  );

  const itemsAjustados = itemsOriginales.map((item) => {
    const returnedQty = returnedByOriginalId.get(item.DOUId) ?? 0;
    const originalQty = Number(item.DOUCantidad);
    const originalWeightKg = Number(item.DOUPesoTotalKg);
    const netQty = Math.max(originalQty - returnedQty, 0);
    if (netQty === originalQty) {
      return item;
    }

    if (netQty === 0) {
      return {
        ...item,
        DOUCantidad: 0,
        DOUVrBruto: 0,
        DOUVrNeto: 0,
        DOUPesoTotalKg: 0,
      };
    }

    const ratio = netQty / originalQty;
    return {
      ...item,
      DOUCantidad: netQty,
      DOUVrBruto: Number(item.DOUVrBruto) * ratio,
      DOUVrNeto: Number(item.DOUVrNeto) * ratio,
      DOUPesoTotalKg: roundWeightKg(originalWeightKg * ratio),
    };
  });

  // 6. Retornar dispatch order con items ajustados (solo items originales con cantidades netas)
  // y items de devolución para mostrar en el frontend
  return mapDispatchOrderGToApi({
    ...dispatchOrder,
    dispatchOrderU: itemsAjustados,
    dispatchOrderReturns: itemsDevolucion,
  });
};

// ===== FUNCIONES AUXILIARES PARA MOVKAR =====

/**
 * Obtiene el tipo de movimiento de salida configurado para facturas/dispatch orders
 */
const obtenerTipoMovimientoFactura = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  // Try to find by purpose first
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.DISPATCH_ORDER,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No outbound movement type configured for invoices was found. Please configure a movement type with purpose DISPATCH_ORDER or with TFactura=true.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento de salida configurado para facturas/dispatch orders
 */
const obtenerTipoMovimientoDispatchOrder = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  // Try to find by purpose first
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.DISPATCH_ORDER,
    },
    orderBy: {
      TOrgSecuencia: "asc",
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No outbound movement type configured for invoices/dispatch orders was found. Please configure a movement type with purpose DISPATCH_ORDER.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el primer almacén de la organización
 */
const obtenerAlmacenParaFactura = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  const almacen = await tx.almacen.findFirst({
    where: {
      ALOrganizationId: organizationId,
    },
    orderBy: {
      ALOrgSecuencia: "asc",
    },
  });

  if (!almacen) {
    throw new EntityValidationError(
      "No warehouse registered for the organization was found. Please register at least one warehouse.",
    );
  }

  return almacen;
};

/**
 * Calculates all order totals from items
 * Returns: { valorTotalBruto, totalDescuento, totalIVA, valorTotalNeto }
 *
 * IMPORTANT: This must match the exact calculation logic used when creating/updating items
 * The calculation matches the pattern used in addDispatchOrderItem (lines 1324-1342)
 */
function calculateOrderTotalsFromItems(
  items: (DispatchOrderU & {
    invcaruni: Invcaruni;
    tipoMovimiento: { TProposito: null | TipoPropositoMovkar };
  })[],
): {
  totalDescuento: number;
  totalIVA: number;
  valorTotalBruto: number;
  valorTotalNeto: number;
} {
  let valorTotalBruto = 0;
  let totalDescuento = 0;
  let totalIVA = 0;

  for (const item of items) {
    // Use pre-calculated DOUVrBruto which already has correct sign
    // (positive for original items, negative for return items)
    const itemBruto = Number(item.DOUVrBruto);
    const descuento = Number(item.DOUDescuento);
    const ivaRate = Number(item.invcaruni.CKIva);

    valorTotalBruto += itemBruto;

    // Descuento = bruto × (descuento / 100)
    // For returns, itemBruto is negative, so itemDescuento will be negative too
    // This correctly "returns" the discount amount
    const itemDescuento = itemBruto * (descuento / 100);
    totalDescuento += itemDescuento;

    // IVA = (bruto - descuento) × (ivaRate / 100) if item has tax
    // For returns, subtotal is negative, so IVA will be negative too
    if (item.DOUTieneImpuesto && ivaRate > 0) {
      const subtotalAfterDiscount = itemBruto - itemDescuento;
      const itemIVA = subtotalAfterDiscount * (ivaRate / 100);
      totalIVA += itemIVA;
    }
  }

  // Neto = (bruto - descuento) + IVA
  const valorTotalNeto = valorTotalBruto - totalDescuento + totalIVA;

  return { valorTotalBruto, totalDescuento, totalIVA, valorTotalNeto };
}

function roundWeightKg(value: number): number {
  return Math.round(value * 100) / 100;
}

async function recalculateDispatchOrderTotals(
  tx: Prisma.TransactionClient,
  options: {
    dispatchOrderGId: number;
    dispatchOrderNro: number;
    organizationId: string;
    updateWeightSnapshots: boolean;
  },
) {
  const {
    dispatchOrderGId,
    dispatchOrderNro,
    organizationId,
    updateWeightSnapshots,
  } = options;

  const allItems = await tx.dispatchOrderU.findMany({
    where: {
      DOUNro: dispatchOrderNro,
      DOUOrganizationId: organizationId,
    },
    include: {
      invcaruni: true,
      tipoMovimiento: {
        select: {
          TProposito: true,
        },
      },
    },
    orderBy: [
      { invcaruni: { CKDescripcion: "asc" } },
      { DOULote: "asc" },
      { DOUId: "asc" },
    ],
  });

  const totals = calculateOrderTotalsFromItems(allItems);

  let totalWeightKg = 0;
  if (updateWeightSnapshots) {
    for (const item of allItems) {
      const isReturnOrAnnulment =
        item.tipoMovimiento.TProposito ===
          TipoPropositoMovkar.DISPATCH_ORDER_DEVOLUCION ||
        item.tipoMovimiento.TProposito ===
          TipoPropositoMovkar.DISPATCH_ORDER_ANULACION;
      const signedQuantity = isReturnOrAnnulment
        ? -Number(item.DOUCantidad)
        : Number(item.DOUCantidad);
      const itemWeightKg = roundWeightKg(
        signedQuantity * Number(item.invcaruni.CKPesoPromedioKg),
      );
      totalWeightKg += itemWeightKg;

      await tx.dispatchOrderU.update({
        where: { DOUId: item.DOUId },
        data: {
          DOUPesoTotalKg: itemWeightKg,
        },
      });
    }

    totalWeightKg = roundWeightKg(totalWeightKg);
  }

  await tx.dispatchOrderG.update({
    where: { DOGId: dispatchOrderGId },
    data: {
      DOGValorTotalBruto: totals.valorTotalBruto,
      DOGTotalDescuento: totals.totalDescuento,
      DOGTotalIVA: totals.totalIVA,
      DOGValorTotalNeto: totals.valorTotalNeto,
      ...(updateWeightSnapshots ? { DOGPesoTotalKg: totalWeightKg } : {}),
    },
  });

  return allItems;
}

/**
 * Obtiene el tipo de movimiento de entrada configurado para devoluciones
 * Busca por propósito DISPATCH_ORDER_DEVOLUCION primero, luego fallback a boolean flags
 */
const obtenerTipoMovimientoDevolucion = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  // Try to find by purpose first
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.DISPATCH_ORDER_DEVOLUCION,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No inbound movement type configured for returns was found. " +
        "Please configure a movement type with purpose DISPATCH_ORDER_DEVOLUCION or with TTipo=1 (Inbound) and TAfecta=true.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento de entrada configurado para anulacion
 * Busca por propósito ANULACION_DISPATCH_ORDER
 */
const obtenerTipoMovimientoAnulacion = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  // Try to find by purpose first
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.DISPATCH_ORDER_ANULACION,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No movement type configured for dispatch order cancellation was found. " +
        "Please configure a movement type with purpose DISPATCH_ORDER_ANULACION.",
    );
  }

  return tipoMovimiento;
};

// ===== HELPER FUNCTIONS PARA RESERVAS =====

/**
 * Obtiene el KardexLoteId a partir del número de lote
 */
async function getKardexLoteIdByLoteNumber(
  lote: string,
  invcaruniId: number,
  almacenId: number,
  organizationId: string,
  tx: Prisma.TransactionClient,
): Promise<number> {
  // 1. Buscar kardex
  const kardex = await tx.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
    },
  });

  if (!kardex) {
    throw new EntityNotFoundError("Kardex not found");
  }

  // 2. Buscar kardexLote por lote number
  const kardexLote = await tx.kardexLote.findFirst({
    where: {
      KLKardexId: kardex.KId,
      KLLote: lote,
      KLOrganizationId: organizationId,
    },
  });

  if (!kardexLote) {
    throw new EntityNotFoundError(`KardexLote not found for lot ${lote}`);
  }

  return kardexLote.KLId;
}

/**
 * Obtiene el KardexLoteId a partir del número de lote y número de documento.
 * KardexLote is uniquely identified by (KLKardexId, KLCiudadId, KLLote, KLNroDocumento, KLMes, KLAno).
 */
async function getKardexLoteIdByLoteAndDocument(
  lote: string,
  nroDocumento: string,
  invcaruniId: number,
  almacenId: number,
  organizationId: string,
  tx: Prisma.TransactionClient,
): Promise<number> {
  const kardex = await tx.kardex.findFirst({
    where: {
      KOrganizationId: organizationId,
      KInvcaruniId: invcaruniId,
      KAlmacenId: almacenId,
    },
  });

  if (!kardex) {
    throw new EntityNotFoundError("Kardex not found");
  }

  const kardexLote = await tx.kardexLote.findFirst({
    where: {
      KLKardexId: kardex.KId,
      KLLote: lote,
      KLNroDocumento: nroDocumento,
      KLOrganizationId: organizationId,
    },
  });

  if (!kardexLote) {
    throw new EntityNotFoundError(
      `KardexLote not found for lot ${lote} (Doc: ${nroDocumento})`,
    );
  }

  return kardexLote.KLId;
}

/**
 * Obtiene o crea la configuración de reservas para una organización
 */
async function getOrCreateReservationConfig(
  organizationId: string,
  tx: Prisma.TransactionClient,
) {
  let config = await tx.reservationConfig.findUnique({
    where: { RCOrganizationId: organizationId },
  });

  config ??= await tx.reservationConfig.create({
    data: {
      RCOrganizationId: organizationId,
      RCDiasExpiracion: 3,
      RCNotificarAntes: 1,
      RCAutoLiberarExpiradas: true,
      usuario: "system",
    },
  });

  return config;
}

/**
 * Crea una reserva para un item de dispatch order
 * Si falla, lanza error para hacer rollback de la transacción
 */
async function createReservationForItem(
  dispatchOrderUId: number,
  invcaruniId: number,
  lote: string,
  nroDocumento: string,
  cantidad: number,
  almacenId: number,
  organizationId: string,
  usuario: string,
  tx: Prisma.TransactionClient,
) {
  // 1. Obtener kardexLoteId (lot + document number)
  const kardexLoteId = await getKardexLoteIdByLoteAndDocument(
    lote,
    nroDocumento,
    invcaruniId,
    almacenId,
    organizationId,
    tx,
  );

  // 2. Obtener o crear config
  const config = await getOrCreateReservationConfig(organizationId, tx);

  // 3. Validar stock disponible (considerando otras reservas)
  const kardexLote = await tx.kardexLote.findUnique({
    where: { KLId: kardexLoteId },
  });

  if (!kardexLote) {
    throw new EntityNotFoundError("KardexLote not found");
  }

  const reservedQty = await getReservedQuantityByLote(
    kardexLoteId,
    organizationId,
    tx,
    undefined, // excludeDispatchOrderGId - not excluding by order
    dispatchOrderUId, // exclude this item's reservation if it exists
  );

  const onHand = Number(kardexLote.KLExistenciaFin);
  const existenciaDisponible = onHand - reservedQty;

  if (cantidad > existenciaDisponible) {
    throw new InsufficientStockError(
      `Not enough stock for this item. Available: ${existenciaDisponible}.`,
    );
  }

  // 4. Calcular fecha de expiración
  const fechaReserva = new Date();
  const fechaExpiracion = new Date(fechaReserva);
  fechaExpiracion.setDate(fechaExpiracion.getDate() + config.RCDiasExpiracion);

  // 5. Obtener siguiente secuencia
  const ultimoSecuencial = await tx.inventoryReservation.findFirst({
    where: { IROrganizationId: organizationId },
    orderBy: { IROrgSecuencia: "desc" },
  });
  const siguienteSecuencial = (ultimoSecuencial?.IROrgSecuencia ?? 0) + 1;

  // 6. Crear reserva
  await tx.inventoryReservation.create({
    data: {
      IROrganizationId: organizationId,
      IRDispatchOrderUId: dispatchOrderUId,
      IRInvcaruniId: invcaruniId,
      IRKardexLoteId: kardexLoteId,
      IRCantidadReservada: cantidad,
      IRFechaReserva: fechaReserva,
      IRFechaExpiracion: fechaExpiracion,
      IREstado: EstadoReserva.ACTIVE,
      IROrgSecuencia: siguienteSecuencial,
      usuario,
    },
  });

  // 7. Actualizar DOUReservado flag
  await tx.dispatchOrderU.update({
    where: { DOUId: dispatchOrderUId },
    data: { DOUReservado: true },
  });
}

// ===== VALIDACIÓN DE INVENTARIO =====

/**
 * Valida disponibilidad de stock para los items del dispatch order
 * Basado en COBOL lines 535-540
 */
export const validateStockAvailability = async (
  items: DispatchOrderItemDto[],
  organizationId: string,
) => {
  const stockErrors: string[] = [];

  // TODO: fix many request
  for (const item of items) {
    const producto = await prisma.invcaruni.findFirst({
      where: {
        CKId: item.DOUInvcaruniId,
        CKOrganizationId: organizationId,
      },
    });

    if (!producto) {
      stockErrors.push(
        `Product with ID ${item.DOUInvcaruniId} not found in organization`,
      );
      continue;
    }

    // Obtener existencia desde Kardex (suma de todos los almacenes)
    const kardexRecords = await prisma.kardex.findMany({
      where: {
        KInvcaruniId: item.DOUInvcaruniId,
        KOrganizationId: organizationId,
      },
    });

    const existenciaTotal = kardexRecords.reduce(
      (sum, k) => sum + Number(k.KExistenciaFin),
      0,
    );

    // Validar stock disponible (excepto grupo 999, código 00009)
    if (producto.CKGrupoId !== 999 || producto.CKCodigo !== 9) {
      if (item.DOUCantidad > existenciaTotal) {
        stockErrors.push(
          `Insufficient stock for ${producto.CKDescripcion}. Available: ${existenciaTotal}, Requested: ${item.DOUCantidad}`,
        );
      }
    }
  }

  return {
    valid: stockErrors.length === 0,
    errors: stockErrors,
  };
};

// ===== CÁLCULOS DE TOTALES =====

/**
 * Calcula totales de dispatch order según lógica COBOL
 * Basado en COBOL lines 631-670
 */
export const calculateInvoiceTotals = async (
  tx: Prisma.TransactionClient,
  items: DispatchOrderItemDto[],
  organizationId: string,
  isManual: boolean,
): Promise<CalculatedTotals> => {
  const calculatedItems = [];
  let valorTotalNeto = 0;
  let valorTotalBruto = 0;

  // Collect all unique product IDs
  const productIds = [...new Set(items.map((item) => item.DOUInvcaruniId))];

  // Fetch all products in a single query
  const productos = await tx.invcaruni.findMany({
    where: {
      CKId: { in: productIds },
      CKOrganizationId: organizationId,
    },
  });

  // Create a Map for O(1) product lookup
  const productosMap = new Map(productos.map((p) => [p.CKId, p]));

  for (const item of items) {
    // Look up product from the Map
    const producto = productosMap.get(item.DOUInvcaruniId);

    if (!producto) {
      throw new EntityNotFoundError(
        `Product with ID ${item.DOUInvcaruniId} not found`,
      );
    }

    // Always use DOUCantidad for both manual and automatic modes
    const cantidadProducto = item.DOUCantidad;

    if (cantidadProducto === 0) {
      throw new EntityValidationError(
        `Quantity is required for product ${producto.CKDescripcion}`,
      );
    }

    // Validar descuento contra tope permitido (COBOL lines 563-569)
    if (Number(producto.CKPorcenMargenTopeDesc) > 0) {
      if (item.DOUDescuento > Number(producto.CKPorcenMargenTopeDesc)) {
        throw new EntityValidationError(
          `Discount ${item.DOUDescuento}% exceeds maximum allowed ${producto.CKPorcenMargenTopeDesc}% for ${producto.CKDescripcion}`,
        );
      }
    }

    let subtotalBrutoItem = cantidadProducto * item.DOUVrUnitario;

    // Calcular descuento
    if (item.DOUDescuento > 0) {
      const valorDescuento = item.DOUVrUnitario * (item.DOUDescuento / 100);

      // Determinar precio según tipo de pago (COBOL lines 366-369)
      const precio = item.DOUVrUnitario - valorDescuento;
      subtotalBrutoItem = cantidadProducto * precio;
    }

    // Calcular precio sin IVA si el producto tiene IVA (COBOL lines 639-642)
    const productoTieneIva = Number(producto.CKIva) > 0;
    // Calcular IVA (COBOL lines 652-663)
    let valorIva = 0;
    if (productoTieneIva && item.DOUTieneImpuesto) {
      valorIva = subtotalBrutoItem * (Number(producto.CKIva) / 100);
    }

    // Total del item
    const totalBrutoItem = subtotalBrutoItem + valorIva;

    calculatedItems.push({
      productoId: item.DOUInvcaruniId,
      cantidad: cantidadProducto,
      precioNeto: item.DOUVrUnitario * cantidadProducto,
      precioBruto: totalBrutoItem,
      precioUnitario: item.DOUVrUnitario,
      descuento: item.DOUDescuento,
      tieneIva: item.DOUTieneImpuesto && productoTieneIva,
    });

    valorTotalNeto += item.DOUVrUnitario * cantidadProducto;
    valorTotalBruto += totalBrutoItem;
  }

  return {
    dispatchOrderU: calculatedItems,
    valorTotalNeto,
    valorTotalBruto,
  };
};

// ===== CREACIÓN Y ACTUALIZACIÓN =====

/**
 * Actualiza una dispatch order en estado DRAFT
 */
export const updateDispatchOrder = async (
  id: number,
  data: ActualizarDispatchOrderDto,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Buscar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: id,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    // 2. Validar que esté en DRAFT
    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DRAFT) {
      throw new EntityValidationError("Can only update DRAFT dispatch orders");
    }

    const { ...updateHeaderData } = data;

    // 4. Actualizar header
    const dispatchOrderActualizada = await tx.dispatchOrderG.update({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: id,
        },
      },
      data: updateHeaderData,
      include: {
        cltemae: true,
        vendedor: true,
        dispatchOrderU: {
          include: {
            invcaruni: true,
          },
          orderBy: [
            { invcaruni: { CKDescripcion: "asc" } },
            { DOULote: "asc" },
            { DOUId: "asc" },
          ],
        },
      },
    });

    return mapDispatchOrderGToApi(dispatchOrderActualizada);
  });
};

/**
 * Emite una dispatch order (cambia estado a EMITTED y crea movimientos de inventario)
 * Basado en COBOL CRUZAFAI call line 778-781
 */
export const emitInvoice = async (
  sequence: number,
  organizationId: string,
  data: EmitirDispatchOrderDto,
) => {
  const fechaEmision = new Date();
  const targetPeriod = periodFromDate(fechaEmision);
  await assertPriorPeriodsClosed(organizationId, targetPeriod);

  const { outboxEventId } = await prisma.$transaction(
    async (tx) => {
      // 1. Buscar dispatch order
      const dispatchOrder = await tx.dispatchOrderG.findUnique({
        where: {
          DOGOrganizationId_DOGOrgSecuencia: {
            DOGOrganizationId: organizationId,
            DOGOrgSecuencia: sequence,
          },
        },
        include: {
          dispatchOrderU: {
            include: {
              invcaruni: true,
            },
            orderBy: [
              { invcaruni: { CKDescripcion: "asc" } },
              { DOULote: "asc" },
              { DOUId: "asc" },
            ],
          },
        },
      });

      if (!dispatchOrder) {
        throw new EntityNotFoundError("Dispatch order not found");
      }

      // 2. Validar que esté en DRAFT
      if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DRAFT) {
        throw new EntityValidationError("Dispatch order is already emitted");
      }

      const { dispatchOrderU, ...updateHeaderData } = data;

      if (
        !dispatchOrder.dispatchOrderU ||
        dispatchOrder.dispatchOrderU.length === 0
      ) {
        throw new EntityValidationError("Dispatch order has no items");
      }

      if (
        dispatchOrder.dispatchOrderU.some(
          (item) => Number(item.DOUVrUnitario) === 0,
        )
      ) {
        throw new EntityValidationError("Unit price cannot be 0");
      }

      // 3. Validar que todos los items tengan DOULote asignado
      for (const item of dispatchOrder.dispatchOrderU) {
        if (!item.DOULote) {
          throw new EntityValidationError(
            `Item ${item.invcaruni.CKDescripcion} does not have a lot assigned. All items must have a lot before emitting.`,
          );
        }
      }

      // 4. Obtener datos necesarios para movimientos de inventario
      const tipoMovimientoFactura = await obtenerTipoMovimientoFactura(
        organizationId,
        tx,
      );
      const almacen = await obtenerAlmacenParaFactura(organizationId, tx);

      // Snapshot final de pesos antes de emitir.
      await recalculateDispatchOrderTotals(tx, {
        dispatchOrderGId: dispatchOrder.DOGId,
        dispatchOrderNro: dispatchOrder.DOGNro,
        organizationId,
        updateWeightSnapshots: true,
      });

      // 5. Cambiar estado a EMITTED y actualizar fecha de emisión
      const dispatchOrderEmitida = await tx.dispatchOrderG.update({
        where: {
          DOGOrganizationId_DOGOrgSecuencia: {
            DOGOrganizationId: organizationId,
            DOGOrgSecuencia: sequence,
          },
        },
        data: {
          ...updateHeaderData,
          DOGEstado: EstadoDispatchOrder.EMITTED,
          DOGFechaEmision: fechaEmision,
          DOGEmittedPdfNeedsWarehouseRefresh: false,
        },
        include: {
          dispatchOrderU: {
            include: {
              invcaruni: true,
            },
            orderBy: [
              { invcaruni: { CKDescripcion: "asc" } },
              { DOULote: "asc" },
              { DOUId: "asc" },
            ],
          },
        },
      });

      // 6. Crear movimientos de inventario (Movkar) para cada item
      // Como cada item ya tiene DOULote asignado, siempre se trata como modo manual
      for (const item of dispatchOrderEmitida.dispatchOrderU) {
        // Validar que el item tenga DOULote
        if (!item.DOULote) {
          throw new EntityValidationError(
            `Item ${item.invcaruni.CKDescripcion} does not have a lot assigned`,
          );
        }

        // Calcular MVImpuesto: solo si DOUTieneImpuesto es true, usar CKIva del producto
        const mvImpuesto = item.DOUTieneImpuesto
          ? Number(item.invcaruni.CKIva)
          : 0;

        // Validar stock del lote específico
        const kardex = await tx.kardex.findFirst({
          where: {
            KOrganizationId: organizationId,
            KInvcaruniId: item.DOUInvcaruniId,
            KAlmacenId: almacen.ALId,
          },
        });

        if (!kardex) {
          throw new EntityNotFoundError(
            `No kardex found for product ${item.invcaruni.CKDescripcion}`,
          );
        }

        // Validar que el lote existe y tiene suficiente stock
        const kardexLote = await tx.kardexLote.findFirst({
          where: {
            KLKardexId: kardex.KId,
            KLLote: item.DOULote,
            KLNroDocumento: item.DOUNroDocumento,
            KLOrganizationId: organizationId,
          },
        });

        if (!kardexLote) {
          throw new EntityNotFoundError(
            `Lot ${item.DOULote} (Doc: ${item.DOUNroDocumento}) not found for product ${item.invcaruni.CKDescripcion}`,
          );
        }

        // Calculate available stock considering reservations
        // Exclude reservations from this dispatch order since they will be consumed upon emission
        const reservedQty = await getReservedQuantityByLote(
          kardexLote.KLId,
          organizationId,
          tx,
          dispatchOrder.DOGId, // excludeDispatchOrderGId - exclude all reservations from this dispatch order
        );
        const onHand = Number(kardexLote.KLExistenciaFin);
        const existenciaDisponible = onHand - reservedQty;
        if (Number(item.DOUCantidad) > existenciaDisponible) {
          throw new EntityValidationError(
            `Insufficient stock in lot ${item.DOULote} for product ${item.invcaruni.CKDescripcion}: on-hand ${onHand}, reserved ${reservedQty}, available ${existenciaDisponible}`,
          );
        }

        const costoPromedio = await obtenerCostoPromedioProducto(
          organizationId,
          item.DOUInvcaruniId,
          almacen.ALId,
          tx,
        );

        await tx.dispatchOrderU.update({
          where: { DOUId: item.DOUId },
          data: { DOUCostoPromedio: costoPromedio.costoPromedio },
        });

        try {
          // Crear movimiento en modo manual usando el lote del item
          await crearMovimientoConTx(
            tx,
            {
              MVTipoMovimientoId: tipoMovimientoFactura.TId,
              MVCantidad: Number(item.DOUCantidad),
              MVClienteId: dispatchOrderEmitida.DOGClienteId,
              MVProveedorId: null,
              MVNroDocumento: dispatchOrderEmitida.DOGNro.toString(),
              MVFecha: fechaEmision,
              MVCostoPrecio: Number(item.DOUVrUnitario),
              MVCostoSalida: costoPromedio.costoPromedio,
              MVDescuento: Number(item.DOUDescuento),
              MVImpuesto: mvImpuesto,
              MVEsCostoTemporalCero: false,
              modoSalida: "manual", // Siempre manual porque cada item ya tiene su lote
              lotesManual: [
                {
                  lote: item.DOULote,
                  nroDocumento: item.DOUNroDocumento,
                  cantidad: Number(item.DOUCantidad),
                },
              ],
              // kardexLoteId: 1, // Valor dummy requerido por el validador
              invcaruniId: item.DOUInvcaruniId,
              almacenId: almacen.ALId,
              organizationId: organizationId,
              ciudadId: dispatchOrderEmitida.DOGCiudadId,
            },
            dispatchOrderEmitida.usuario,
            false,
            targetPeriod,
          );
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          throw new InternalError(
            `Error creating inventory movement for product ${item.invcaruni.CKDescripcion}: ${msg}`,
          );
        }
      }

      // Consume all reservations for this dispatch order
      await consumeReservationsForDispatchOrder(
        dispatchOrder.DOGId,
        organizationId,
        tx,
      );

      // Create outbox event for async processing (PDF, S3, Email)
      const outboxEvent = await tx.outboxEvent.create({
        data: {
          organizationId: organizationId,
          eventType: "DISPATCH_ORDER_EMITTED",
          aggregateType: "DISPATCH_ORDER",
          aggregateId: dispatchOrderEmitida.DOGId,
          payload: {
            secuencia: dispatchOrderEmitida.DOGOrgSecuencia,
            nro: dispatchOrderEmitida.DOGNro,
            usuario: dispatchOrderEmitida.usuario,
            organizationId: organizationId,
          },
          status: "PENDING",
          maxAttempts: 3,
        },
      });

      return { outboxEventId: outboxEvent.id };
    },
  );

  outboxProcessQueue
    .add("process-dispatch-order-emitted", { eventId: outboxEventId })
    .catch((err: unknown) => {
      console.error(
        "[queue] Failed to enqueue DISPATCH_ORDER_EMITTED outbox event, cron will retry:",
        err,
      );
    });

  // Re-fetch through the read path so the response shape matches exactly what
  // the frontend schema expects (cltemae, vendedor, ciudad, nested item
  // relations and netted returns). The emit query above only includes the
  // relations needed for inventory movements, which is why mapping it directly
  // produced a payload the client could not parse.
  return getDispatchOrderBySecuencia(sequence, organizationId);
};

export async function notifyClientDispatchedWithEmitPdfFromS3(params: {
  clientDisplayName: string;
  DOGCorreo1: string;
  DOGCorreo2: null | string;
  DOGId: number;
  DOGNro: number;
  organizationId: string;
}): Promise<void> {
  const {
    DOGId,
    DOGNro,
    DOGCorreo1,
    DOGCorreo2,
    clientDisplayName,
    organizationId,
  } = params;

  const pdfDoc = await findLatestDispatchOrderEmittedAutoPdf(
    DOGId,
    DOGNro,
    organizationId,
  );
  if (!pdfDoc) {
    console.warn(
      `[dispatchOrder] No emitted auto PDF in DB for dispatch order DOGId=${DOGId} DOGNro=${DOGNro}; client dispatch email skipped.`,
    );
    return;
  }

  const clientEmails = normalizeDispatchRecipientEmails([
    DOGCorreo1,
    DOGCorreo2,
  ]);
  if (clientEmails.length === 0) {
    console.log(
      `[dispatchOrder] No valid client emails for DOGId=${DOGId}; client dispatch email skipped.`,
    );
    return;
  }

  const pdfBuffer = await getObjectBuffer(pdfDoc.DOCFileKey);
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });

  const emailResult = await sendDispatchOrderDispatchedClientEmailBatch(
    clientEmails,
    DOGNro,
    organization?.name,
    clientDisplayName,
    pdfBuffer,
  );

  if (
    emailResult.permanentFailures.length > 0 ||
    emailResult.transientFailures.length > 0
  ) {
    console.warn(
      `[dispatchOrder] Client dispatch email partial failure DOGId=${DOGId} DOGNro=${DOGNro}:`,
      {
        permanentFailures: emailResult.permanentFailures,
        transientFailures: emailResult.transientFailures,
      },
    );
  }
}

/**
 * Despacha una dispatch order (EMITTED -> DISPATCHED)
 * Sube documentos firmados y cambia el estado
 */
export const dispatchOrder = async (
  sequence: number,
  files: Express.Multer.File[],
  organizationId: string,
  usuario: string,
) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Buscar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: sequence,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    // 2. Validar que esté en EMITTED
    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.EMITTED) {
      throw new EntityValidationError(
        `Cannot dispatch order in ${dispatchOrder.DOGEstado} state. Order must be EMITTED.`,
      );
    }

    if (dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh) {
      throw new EntityValidationError(
        "Regenerate the dispatch PDF and notify the warehouse before dispatching.",
      );
    }

    // 3. Validar que haya al menos un documento
    if (files.length === 0) {
      throw new EntityValidationError(
        "At least one document is required to dispatch",
      );
    }

    // 4. Subir documentos a S3 y guardar metadata
    // Note: This happens outside the transaction since S3 operations are not transactional
    // If S3 upload fails, the transaction will rollback
    const uploadedDocuments = await uploadDocument(
      files,
      DocumentType.DISPATCH_ORDER,
      dispatchOrder.DOGId,
      organizationId,
      usuario,
    );

    // 5. Cambiar estado a DISPATCHED y actualizar fecha de despacho
    const fechaDespacho = new Date();
    const dispatchOrderDespachada = await tx.dispatchOrderG.update({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: sequence,
        },
      },
      data: {
        DOGEstado: EstadoDispatchOrder.DISPATCHED,
        DOGFechaDespacho: fechaDespacho,
      },
      include: {
        cltemae: true,
        vendedor: true,
        dispatchOrderU: {
          include: {
            invcaruni: true,
          },
          orderBy: [
            { invcaruni: { CKDescripcion: "asc" } },
            { DOULote: "asc" },
            { DOUId: "asc" },
          ],
        },
      },
    });

    return {
      dispatchOrder: dispatchOrderDespachada,
      documents: uploadedDocuments,
    };
  });

  const { dispatchOrder: d } = result;
  const clientDisplayName = d.cltemae.CRazonSocial ?? d.cltemae.CNombreCliente;

  emailDispatchDispatchedQueue
    .add("notify-client-dispatched", {
      dispatchOrderGId: d.DOGId,
      DOGNro: d.DOGNro,
      organizationId,
      clienteEmail1: d.DOGCorreo1,
      clienteEmail2: d.DOGCorreo2,
      clientDisplayName,
    })
    .catch((err) => {
      console.error(
        `[queue] Failed to enqueue dispatch client notification for DOGId=${d.DOGId}:`,
        err,
      );
    });

  // Map decimals to numbers for the API response so the client can parse the
  // order with the same schema as every other resource endpoint. The internal
  // email path above intentionally reads the raw entity.
  return {
    dispatchOrder: mapDispatchOrderGToApi(result.dispatchOrder),
    documents: result.documents,
  };
};

/**
 * Regenerates the programmatic dispatch-order PDF after returns on EMITTED,
 * replaces prior auto-generated S3 rows, emails warehouse managers, and clears the refresh flag.
 */
export const regenerateEmittedDispatchOrderPdf = async (
  sequence: number,
  organizationId: string,
  usuario: string,
) => {
  const dispatchOrder = await prisma.dispatchOrderG.findUnique({
    where: {
      DOGOrganizationId_DOGOrgSecuencia: {
        DOGOrganizationId: organizationId,
        DOGOrgSecuencia: sequence,
      },
    },
  });

  if (!dispatchOrder) {
    throw new EntityNotFoundError("Dispatch order not found");
  }

  if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.EMITTED) {
    throw new EntityValidationError(
      "Can only regenerate the emitted PDF when the dispatch order is in EMITTED state.",
    );
  }

  if (!dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh) {
    throw new EntityValidationError(
      "Warehouse PDF refresh is not required for this dispatch order.",
    );
  }

  // Recalculate weight snapshots only for the EMITTED regeneration flow.
  await prisma.$transaction(async (tx) => {
    await recalculateDispatchOrderTotals(tx, {
      dispatchOrderGId: dispatchOrder.DOGId,
      dispatchOrderNro: dispatchOrder.DOGNro,
      organizationId,
      updateWeightSnapshots: true,
    });
  });

  const pdfBuffer = await generateDispatchOrderPDF(sequence, organizationId);

  const autoPdfWhere = dispatchOrderEmittedAutoPdfWhere(
    dispatchOrder.DOGId,
    dispatchOrder.DOGNro,
    organizationId,
  );
  const previousAutoPdfKeys = (
    await prisma.document.findMany({
      where: autoPdfWhere,
      select: { DOCFileKey: true },
    })
  ).map((d) => d.DOCFileKey);

  const uploadMeta = await putDispatchOrderEmittedAutoPdfBufferToS3(
    pdfBuffer,
    dispatchOrder.DOGId,
    dispatchOrder.DOGNro,
    organizationId,
    usuario,
  );

  try {
    await prisma.$transaction(async (tx) => {
      await tx.document.deleteMany({ where: autoPdfWhere });
      await tx.document.create({
        data: {
          DOCOrganizationId: organizationId,
          DOCDocumentType: DocumentType.DISPATCH_ORDER,
          DOCDocumentId: dispatchOrder.DOGId,
          DOCFileName: uploadMeta.systemFileName,
          DOCOriginalFileName: uploadMeta.DOCOriginalFileName,
          DOCFileKey: uploadMeta.s3Key,
          DOCFileSize: uploadMeta.DOCFileSize,
          DOCMimeType: uploadMeta.DOCMimeType,
          DOCUploadedBy: usuario,
        },
      });
      await tx.dispatchOrderG.update({
        where: { DOGId: dispatchOrder.DOGId },
        data: { DOGEmittedPdfNeedsWarehouseRefresh: false },
      });
    });
  } catch (err) {
    await deleteS3ObjectsBestEffort([uploadMeta.s3Key]);
    throw err;
  }

  await deleteS3ObjectsBestEffort(previousAutoPdfKeys);

  const warehouseManagers = await prisma.member.findMany({
    where: {
      organizationId,
      role: "warehouse_manager",
    },
    select: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  const warehouseManagerEmails = normalizeDispatchRecipientEmails(
    warehouseManagers.map((m) => m.user?.email),
  );
  const emails = filterPendingEmails(warehouseManagerEmails, {});

  if (emails.length > 0) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    const result = await sendDispatchOrderEmailBatch(
      emails,
      dispatchOrder.DOGNro,
      organization?.name,
      pdfBuffer,
    );
    if (result.transientFailures.length > 0) {
      throw new InternalError(
        `Email delivery had transient failures: ${result.transientFailures
          .map((f) => `${f.email} (${f.error})`)
          .join(", ")}`,
      );
    }
  }

  await prisma.dispatchOrderG.update({
    where: { DOGId: dispatchOrder.DOGId },
    data: { DOGEmittedPdfNeedsWarehouseRefresh: false },
  });

  return getDispatchOrderBySecuencia(sequence, organizationId);
};

// ===== NUEVAS FUNCIONES PARA PERSISTENCIA EN TIEMPO REAL =====

/**
 * Crea solo el encabezado (header) de una dispatch order en estado DRAFT
 */
export const createDispatchOrderHeader = async (
  data: CrearDispatchOrderHeaderDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que el cliente existe
    const cliente = await tx.cltemae.findUnique({
      where: { CId: data.DOGClienteId },
    });
    if (cliente?.COrganizationId !== organizationId) {
      throw new EntityNotFoundError(
        "Customer not found or does not belong to organization",
      );
    }

    // 2. Validar vendedor si se proporciona
    if (data.DOGVendedorId) {
      const vendedor = await tx.vendedor.findUnique({
        where: { VId: data.DOGVendedorId },
      });
      if (vendedor?.VOrganizationId !== organizationId) {
        throw new EntityNotFoundError(
          "Vendor not found or does not belong to organization",
        );
      }
    }

    // 4. Calcular siguiente secuencia
    const ultimoSecuencial = await tx.dispatchOrderG.findFirst({
      where: { DOGOrganizationId: organizationId },
      orderBy: { DOGOrgSecuencia: "desc" },
    });
    const siguienteSecuencial = (ultimoSecuencial?.DOGOrgSecuencia ?? 0) + 1;

    // 5. Crear dispatch order header
    const dispatchOrder = await tx.dispatchOrderG.create({
      data: {
        DOGOrganizationId: organizationId,
        DOGNro: siguienteSecuencial,
        DOGOrgSecuencia: siguienteSecuencial,
        DOGClienteId: data.DOGClienteId,
        DOGVendedorId: data.DOGVendedorId,
        DOGPurchaseOrder: data.DOGPurchaseOrder,
        DOGTipo: data.DOGTipo,
        DOGZona: data.DOGZona,
        DOGValorTotalNeto: 0,
        DOGValorTotalBruto: 0,
        DOGTotalDescuento: 0,
        DOGTotalIVA: 0,
        DOGAprobado: "",
        DOGDespachado: "",
        DOGFechaCreado: data.DOGFechaCreado,
        DOGTelefono1: data.DOGTelefono1,
        DOGTelefono2: data.DOGTelefono2 ?? null,
        DOGCorreo1: data.DOGCorreo1,
        DOGCorreo2: data.DOGCorreo2 ?? null,
        DOGDireccionEntrega: data.DOGDireccionEntrega,
        DOGCiudadId: data.DOGCiudadId,
        DOGCondicion1: data.DOGCondicion1 ?? null,
        DOGCondicion2: data.DOGCondicion2 ?? null,
        DOGCondicion3: data.DOGCondicion3 ?? null,
        DOGEstado: EstadoDispatchOrder.DRAFT,
        usuario,
      },
      include: {
        cltemae: true,
        vendedor: true,
        dispatchOrderU: true,
        ciudad: {
          include: {
            estado: {
              include: {
                pais: true,
              },
            },
          },
        },
      },
    });

    return mapDispatchOrderGToApi(dispatchOrder);
  });
};

/**
 * Agrega un item a una dispatch order existente
 * Auto mode: usa FIFO para determinar lotes y puede crear múltiples DispatchOrderU
 * Manual mode: valida lote específico y crea un solo DispatchOrderU
 */
export const addDispatchOrderItem = async (
  dispatchOrderId: number,
  item: {
    DOUCantidad: number;
    DOUDescuento: number;
    DOUInvcaruniId: number;
    DOULote?: string; // lot / PO ref — manual mode & Kardex KLLote
    DOUNroDocumento?: string;
    DOUReservar?: boolean; // Checkbox para reservar
    DOUTieneImpuesto: boolean;
    DOUVrUnitario: number;
  },
  modoSalida: "AUTOMATICO" | "MANUAL",
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la dispatch order existe y está en DRAFT
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
      include: {
        dispatchOrderU: true,
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DRAFT) {
      throw new EntityValidationError(
        "Can only add items to DRAFT dispatch orders",
      );
    }

    // 2. Validar que el producto existe
    const producto = await tx.invcaruni.findFirst({
      where: {
        CKId: item.DOUInvcaruniId,
        CKOrganizationId: organizationId,
      },
    });

    if (!producto) {
      throw new EntityNotFoundError("Product not found");
    }

    // 3. Obtener almacén (necesario para validar lotes)
    const almacen = await obtenerAlmacenParaFactura(organizationId, tx);

    // Obtener tipo de movimiento de dispatch order
    const tipoMovimiento = await obtenerTipoMovimientoDispatchOrder(
      organizationId,
      tx,
    );

    // 4. Obtener costo promedio del producto para almacenar en el item
    const { costoPromedio } = await obtenerCostoPromedioProducto(
      organizationId,
      item.DOUInvcaruniId,
      almacen.ALId,
      tx,
    );

    // 5. Procesar según modo
    const itemsACrear: {
      DOUCantidad: number;
      DOUCostoPromedio: number;
      DOUDescuento: number;
      DOUDetalle: string;
      DOUDispatchOrderGId: number;
      DOUInvcaruniId: number;
      DOULote: string;
      DOUModoSalida: "AUTOMATICO" | "MANUAL";
      DOUNro: number;
      DOUNroDocumento: string;
      DOUOrganizationId: string;
      DOUReservado: boolean;
      DOUTieneImpuesto: boolean;
      DOUTipoMovimientoId: number;
      DOUVrBruto: number;
      DOUVrNeto: number;
      DOUVrUnitario: number;
      usuario: string;
    }[] = [];

    if (modoSalida === "AUTOMATICO") {
      // Modo automático: usar FIFO para determinar lotes
      const distribucionLotes = await obtenerLotesParaSalida(
        tx,
        organizationId,
        item.DOUInvcaruniId,
        almacen.ALId,
        item.DOUCantidad,
        dispatchOrder.dispatchOrderU
          .filter(
            (line) =>
              line.DOUInvcaruniId === item.DOUInvcaruniId &&
              line.DOULote &&
              line.DOUNroDocumento,
          )
          .map((line) => ({
            lote: line.DOULote,
            nroDocumento: line.DOUNroDocumento,
          })),
        dispatchOrder.DOGId, // exclude this order's reservations
      );

      // Calcular valores financieros
      const productoTieneIva = Number(producto.CKIva) > 0;
      const precioUnitario = item.DOUVrUnitario;
      const descuento = item.DOUDescuento;

      // Crear un DispatchOrderU por cada lote usado
      for (const { lote, nroDocumento, cantidad } of distribucionLotes) {
        // Calcular net price (before discount and tax)
        const precioBruto = cantidad * precioUnitario;

        // Calculate subtotal with discount applied
        let subtotalNeto = precioBruto;
        if (descuento > 0) {
          const valorDescuento = precioUnitario * (descuento / 100);
          const precioConDescuento = precioUnitario - valorDescuento;
          subtotalNeto = cantidad * precioConDescuento;
        }

        // Calculate IVA if applicable
        let valorIva = 0;
        if (productoTieneIva && item.DOUTieneImpuesto) {
          valorIva = subtotalNeto * (Number(producto.CKIva) / 100);
        }

        // Calculate total price (with tax)
        const precioNeto = subtotalNeto + valorIva;

        itemsACrear.push({
          DOUNro: dispatchOrder.DOGNro,
          DOUOrganizationId: organizationId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOUDispatchOrderGId: dispatchOrder.DOGId,
          DOUTipoMovimientoId: tipoMovimiento.TId,
          DOUCantidad: cantidad,
          DOUVrBruto: precioBruto,
          DOUVrNeto: precioNeto,
          DOUVrUnitario: precioUnitario,
          DOUDescuento: descuento,
          DOUTieneImpuesto: item.DOUTieneImpuesto,
          DOUDetalle: "",
          DOUReservado: false,
          DOULote: lote,
          DOUNroDocumento: nroDocumento || "",
          DOUModoSalida: modoSalida,
          DOUCostoPromedio: costoPromedio,
          usuario,
        });
      }
    } else {
      // Modo manual: validar lote específico
      if (!item.DOULote || !item.DOUNroDocumento) {
        throw new EntityValidationError(
          "Lot and document number are required for manual mode",
        );
      }

      // Intentional behavior: allow repeated product+lot+document lines so users can
      // split commercial conditions (price/quantity/discount) across independent rows.
      // Stock validation below remains the source of truth for availability safety.

      // Validar que el lote tiene suficiente stock
      const kardex = await tx.kardex.findFirst({
        where: {
          KOrganizationId: organizationId,
          KInvcaruniId: item.DOUInvcaruniId,
          KAlmacenId: almacen.ALId,
        },
      });

      if (!kardex) {
        throw new EntityNotFoundError("No kardex found for this product");
      }

      const kardexLote = await tx.kardexLote.findFirst({
        where: {
          KLKardexId: kardex.KId,
          KLLote: item.DOULote,
          KLNroDocumento: item.DOUNroDocumento,
          KLOrganizationId: organizationId,
        },
      });

      if (!kardexLote) {
        throw new EntityNotFoundError(
          `Lot ${item.DOULote} (Doc: ${item.DOUNroDocumento}) not found for product ${producto.CKDescripcion}`,
        );
      }

      // Calculate available stock considering reservations
      const reservedQty = await getReservedQuantityByLote(
        kardexLote.KLId,
        organizationId,
        tx,
      );
      const onHand = Number(kardexLote.KLExistenciaFin);
      const existenciaDisponible = onHand - reservedQty;
      const requestedTotal = calculateRequestedTotalForLot({
        existingItems: dispatchOrder.dispatchOrderU.map((row) => ({
          DOUId: row.DOUId,
          DOUInvcaruniId: row.DOUInvcaruniId,
          DOULote: row.DOULote,
          DOUNroDocumento: row.DOUNroDocumento,
          DOUCantidad: Number(row.DOUCantidad),
        })),
        invcaruniId: item.DOUInvcaruniId,
        lote: item.DOULote,
        nroDocumento: item.DOUNroDocumento,
        requestedQuantity: item.DOUCantidad,
      });
      if (requestedTotal > existenciaDisponible) {
        throw new InsufficientStockError(
          `Not enough stock in lot ${item.DOULote} (Doc: ${item.DOUNroDocumento}). Available: ${existenciaDisponible}, requested in this order: ${requestedTotal}.`,
        );
      }

      // Calcular valores financieros
      const productoTieneIva = Number(producto.CKIva) > 0;
      const precioUnitario = item.DOUVrUnitario;
      const descuento = item.DOUDescuento;

      // Calcular net price (before discount and tax)
      const precioBruto = item.DOUCantidad * precioUnitario;

      // Calculate subtotal with discount applied
      let subtotalNeto = precioBruto;
      if (descuento > 0) {
        const valorDescuento = precioUnitario * (descuento / 100);
        const precioConDescuento = precioUnitario - valorDescuento;
        subtotalNeto = item.DOUCantidad * precioConDescuento;
      }

      // Calculate IVA if applicable
      let valorIva = 0;
      if (productoTieneIva && item.DOUTieneImpuesto) {
        valorIva = subtotalNeto * (Number(producto.CKIva) / 100);
      }

      // Calculate total price (with tax)
      const precioNeto = subtotalNeto + valorIva;

      itemsACrear.push({
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUInvcaruniId: item.DOUInvcaruniId,
        DOUDispatchOrderGId: dispatchOrder.DOGId,
        DOUTipoMovimientoId: tipoMovimiento.TId,
        DOUCantidad: item.DOUCantidad,
        DOUVrBruto: precioBruto,
        DOUVrNeto: precioNeto,
        DOUVrUnitario: precioUnitario,
        DOUDescuento: descuento,
        DOUTieneImpuesto: item.DOUTieneImpuesto,
        DOUDetalle: "",
        DOUReservado: false,
        DOULote: item.DOULote,
        DOUNroDocumento: item.DOUNroDocumento,
        DOUModoSalida: modoSalida,
        DOUCostoPromedio: costoPromedio,
        usuario,
      });
    }

    // 5. Crear los items usando createMany para insertar en bloque
    await tx.dispatchOrderU.createMany({
      data: itemsACrear,
    });

    // 6. Crear reservas si DOUReservar === true
    // if (item.DOUReservar === true) {
    //   // Obtener items recién creados
    //   const itemsCreados = await tx.dispatchOrderU.findMany({
    //     where: {
    //       DOUNro: dispatchOrder.DOGNro,
    //       DOUOrganizationId: organizationId,
    //       DOUInvcaruniId: item.DOUInvcaruniId,
    //     },
    //     orderBy: { DOUId: "asc" }, // El primero es el original
    //   });

    //   if (modoSalida === "MANUAL") {
    //     // Solo hay un item, crear reserva
    //     const itemCreado = itemsCreados[0];
    //     if (itemCreado.DOULote) {
    //       await createReservationForItem(
    //         itemCreado.DOUId,
    //         itemCreado.DOUInvcaruniId,
    //         itemCreado.DOULote,
    //         itemCreado.DOUCantidad,
    //         almacen.ALId,
    //         organizationId,
    //         usuario,
    //         tx
    //       );
    //     }
    //   } else {
    //     // Modo AUTOMATICO: solo el primer item (original) tiene reserva
    //     const itemOriginal = itemsCreados[0];
    //     if (itemOriginal.DOULote) {
    //       await createReservationForItem(
    //         itemOriginal.DOUId,
    //         itemOriginal.DOUInvcaruniId,
    //         itemOriginal.DOULote,
    //         itemOriginal.DOUCantidad,
    //         almacen.ALId,
    //         organizationId,
    //         usuario,
    //         tx
    //       );
    //     }
    //   }
    // }

    // 7. Recalcular totales del header y snapshots de peso (solo DRAFT)
    const todosLosItems = await recalculateDispatchOrderTotals(tx, {
      dispatchOrderGId: dispatchOrder.DOGId,
      dispatchOrderNro: dispatchOrder.DOGNro,
      organizationId,
      updateWeightSnapshots: true,
    });

    // Normalize Prisma Decimal fields to numbers before returning to the
    // controller, matching every other dispatch-order mutation/read path.
    // Without this the raw Decimals serialize as strings and the client's
    // strict z.number() schema rejects the (already-committed) response.
    return mapDispatchOrderUListToApi(todosLosItems);
  });
};

/**
 * Actualiza un item existente
 * Puede actualizar: cantidad, precio, descuento, impuesto, lote (manual), detalle
 * Si es modo automático y cambia la cantidad, puede dividirse en múltiples items
 */
export const updateDispatchOrderItem = async (
  dispatchOrderId: number,
  itemId: number,
  updateData: {
    DOUCantidad?: number;
    DOUDescuento?: number;
    DOUDetalle?: string;
    DOUReservar?: boolean;
    DOUTieneImpuesto?: boolean;
    DOUVrUnitario?: number;
  },
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DRAFT) {
      throw new EntityValidationError(
        "Can only update items in DRAFT dispatch orders",
      );
    }

    // 2. Obtener item actual
    const itemActual = await tx.dispatchOrderU.findUnique({
      where: {
        DOUId: itemId,
      },
      include: {
        invcaruni: true,
      },
    });

    if (!itemActual) {
      throw new EntityNotFoundError("Item not found");
    }

    if (
      itemActual.DOUNro !== dispatchOrder.DOGNro ||
      itemActual.DOUOrganizationId !== organizationId
    ) {
      throw new EntityValidationError(
        "Item does not belong to this dispatch order",
      );
    }

    const modoSalida = itemActual.DOUModoSalida;

    // 2.5. Verificar reservas activas del item
    const reservasActivas = await tx.inventoryReservation.findMany({
      where: {
        IRDispatchOrderUId: itemId,
        IREstado: EstadoReserva.ACTIVE,
      },
    });
    const tieneReserva = reservasActivas.length > 0;

    // Si el usuario envía explícitamente DOUReservar, usar ese valor
    // Si no envía nada (undefined), mantener el estado actual del item
    const quiereReservar = updateData.DOUReservar ?? itemActual.DOUReservado;

    // 3. Determinar valores finales (usar nuevos valores o mantener actuales)
    const nuevaCantidad =
      updateData.DOUCantidad ?? Number(itemActual.DOUCantidad);
    const nuevoPrecioUnitario =
      updateData.DOUVrUnitario ?? Number(itemActual.DOUVrUnitario);
    const nuevoDescuento =
      updateData.DOUDescuento ?? Number(itemActual.DOUDescuento);
    const nuevoTieneImpuesto =
      updateData.DOUTieneImpuesto ?? itemActual.DOUTieneImpuesto;
    const nuevoDetalle = updateData.DOUDetalle ?? itemActual.DOUDetalle;

    // 4. Validar descuento contra tope permitido del producto
    if (updateData.DOUDescuento !== undefined) {
      const producto = itemActual.invcaruni;
      if (Number(producto.CKPorcenMargenTopeDesc) > 0) {
        if (nuevoDescuento > Number(producto.CKPorcenMargenTopeDesc)) {
          throw new EntityValidationError(
            `Discount ${nuevoDescuento}% exceeds maximum allowed ${producto.CKPorcenMargenTopeDesc}% for ${producto.CKDescripcion}`,
          );
        }
      }
    }

    // 5. Obtener almacén
    const almacen = await obtenerAlmacenParaFactura(organizationId, tx);

    // 5.5. Check for price warning if unit price is being updated
    const warnings: { field: string; message: string; type: string }[] = [];
    if (updateData.DOUVrUnitario !== undefined) {
      const costoPromedioData = await obtenerCostoPromedioProducto(
        organizationId,
        itemActual.DOUInvcaruniId,
        almacen.ALId,
        tx,
      );
      const costoPromedio = costoPromedioData.costoPromedio;

      // Only show warning if average cost is greater than 0 and price is below cost
      if (costoPromedio > 0 && nuevoPrecioUnitario < costoPromedio) {
        warnings.push({
          field: "DOUVrUnitario",
          message: `Unit price is less than average cost (${costoPromedio})`,
          type: "price_below_cost",
        });
      }
    }

    // Obtener tipo de movimiento de dispatch order
    const tipoMovimiento = await obtenerTipoMovimientoDispatchOrder(
      organizationId,
      tx,
    );

    // 6. Manejar validación de lotes según modo
    if (modoSalida === "AUTOMATICO") {
      // Modo automático: si cambió la cantidad, recalcular FIFO
      if (updateData.DOUCantidad !== undefined) {
        // 1. Obtener distribución FIFO para la nueva cantidad total
        const distribucionLotes = await obtenerLotesParaSalida(
          tx,
          organizationId,
          itemActual.DOUInvcaruniId,
          almacen.ALId,
          nuevaCantidad,
          undefined, // skipLotes
          dispatchOrder.DOGId, // exclude this order's reservations
        );

        // 2. Buscar el lote original del item en la distribución
        const loteOriginal = itemActual.DOULote;
        const nroDocumentoOriginal = itemActual.DOUNroDocumento;
        if (!loteOriginal || !nroDocumentoOriginal) {
          throw new EntityValidationError(
            "Item does not have a lot and document number assigned",
          );
        }

        const distribucionLoteOriginal = distribucionLotes.find(
          (d) =>
            d.lote === loteOriginal && d.nroDocumento === nroDocumentoOriginal,
        );

        // 3. Si el lote original no está en la distribución, lanzar error
        if (!distribucionLoteOriginal) {
          throw new EntityValidationError(
            `Lot ${loteOriginal} (Doc: ${nroDocumentoOriginal}) no longer has available stock. Please remove the item and add a new one.`,
          );
        }

        // 4. Separar la distribución: lote original vs lotes adicionales
        const lotesAdicionales = distribucionLotes.filter(
          (d) =>
            d.lote !== loteOriginal || d.nroDocumento !== nroDocumentoOriginal,
        );

        // 5. Calcular valores financieros para el item original
        const productoTieneIva = Number(itemActual.invcaruni.CKIva) > 0;
        const cantidadItemOriginal = distribucionLoteOriginal.cantidad;

        // VrBruto = valor antes de descuento (cantidad × precio unitario)
        const valorBrutoOriginal = cantidadItemOriginal * nuevoPrecioUnitario;
        // VrNeto = valor después de descuento + IVA
        let subtotalConDescuento = valorBrutoOriginal;
        if (nuevoDescuento > 0) {
          const valorDescuento = nuevoPrecioUnitario * (nuevoDescuento / 100);
          const precioConDescuento = nuevoPrecioUnitario - valorDescuento;
          subtotalConDescuento = cantidadItemOriginal * precioConDescuento;
        }
        let valorIvaOriginal = 0;
        if (productoTieneIva && nuevoTieneImpuesto) {
          valorIvaOriginal =
            subtotalConDescuento * (Number(itemActual.invcaruni.CKIva) / 100);
        }
        const valorNetoOriginal = subtotalConDescuento + valorIvaOriginal;

        // 6. ACTUALIZAR el item original (NO eliminarlo)
        await tx.dispatchOrderU.update({
          where: { DOUId: itemId },
          data: {
            DOUCantidad: cantidadItemOriginal,
            DOUVrUnitario: nuevoPrecioUnitario,
            DOUDescuento: nuevoDescuento,
            DOUTieneImpuesto: nuevoTieneImpuesto,
            DOUDetalle: nuevoDetalle,
            DOUVrBruto: valorBrutoOriginal,
            DOUVrNeto: valorNetoOriginal,
            // Mantiene DOULote, DOUModoSalida, DOUReservado
          },
          include: { invcaruni: true },
        });

        // 7. CREAR items adicionales (si hay más lotes en la distribución)
        if (lotesAdicionales.length > 0) {
          const { costoPromedio: costoPromedioItem } =
            await obtenerCostoPromedioProducto(
              organizationId,
              itemActual.DOUInvcaruniId,
              almacen.ALId,
              tx,
            );

          const itemsAdicionalesData = lotesAdicionales.map(
            ({ lote, nroDocumento, cantidad }) => {
              // VrBruto = valor antes de descuento (cantidad × precio unitario)
              const valorBruto = cantidad * nuevoPrecioUnitario;
              // VrNeto = valor después de descuento + IVA
              let subtotalConDescuento = valorBruto;
              if (nuevoDescuento > 0) {
                const valorDescuento =
                  nuevoPrecioUnitario * (nuevoDescuento / 100);
                const precioConDescuento = nuevoPrecioUnitario - valorDescuento;
                subtotalConDescuento = cantidad * precioConDescuento;
              }
              let valorIva = 0;
              if (productoTieneIva && nuevoTieneImpuesto) {
                valorIva =
                  subtotalConDescuento *
                  (Number(itemActual.invcaruni.CKIva) / 100);
              }
              const valorNeto = subtotalConDescuento + valorIva;

              return {
                DOUNro: dispatchOrder.DOGNro,
                DOUOrganizationId: organizationId,
                DOUInvcaruniId: itemActual.DOUInvcaruniId,
                DOUDispatchOrderGId: itemActual.DOUDispatchOrderGId,
                DOUCantidad: cantidad,
                DOUVrBruto: valorBruto,
                DOUVrNeto: valorNeto,
                DOUVrUnitario: nuevoPrecioUnitario,
                DOUDescuento: nuevoDescuento,
                DOUTieneImpuesto: nuevoTieneImpuesto,
                DOUDetalle: nuevoDetalle,
                DOUReservado: false,
                DOULote: lote,
                DOUNroDocumento: nroDocumento || "",
                DOUModoSalida: "MANUAL" as const,
                DOUTipoMovimientoId: tipoMovimiento.TId,
                DOUCostoPromedio: costoPromedioItem,
                usuario,
              };
            },
          );

          await tx.dispatchOrderU.createMany({
            data: itemsAdicionalesData,
          });
        }

        // 8. MANEJAR RESERVA del item original
        if (quiereReservar) {
          if (tieneReserva) {
            // Actualizar cantidad de la reserva existente
            const reserva = reservasActivas[0]!;
            await tx.inventoryReservation.update({
              where: { IRId: reserva.IRId },
              data: {
                IRCantidadReservada: cantidadItemOriginal,
                usuario: usuario,
              },
            });
          } else {
            // Crear nueva reserva
            await createReservationForItem(
              itemId,
              itemActual.DOUInvcaruniId,
              loteOriginal,
              nroDocumentoOriginal,
              cantidadItemOriginal,
              almacen.ALId,
              organizationId,
              usuario,
              tx,
            );
          }
        } else if (tieneReserva) {
          // Liberar reserva existente
          for (const reserva of reservasActivas) {
            await tx.inventoryReservation.update({
              where: { IRId: reserva.IRId },
              data: {
                IREstado: EstadoReserva.RELEASED,
                IRFechaLiberacion: new Date(),
                IRMotivo: "Reservation deactivated by user",
              },
            });
          }
          await tx.dispatchOrderU.update({
            where: { DOUId: itemId },
            data: { DOUReservado: false },
          });
        }

        // 9. Obtener todos los items y recalcular totales + snapshots de peso
        const todosLosItems = await recalculateDispatchOrderTotals(tx, {
          dispatchOrderGId: dispatchOrder.DOGId,
          dispatchOrderNro: dispatchOrder.DOGNro,
          organizationId,
          updateWeightSnapshots: true,
        });

        // Retornar el item actualizado y los adicionales creados
        const itemsResultado = todosLosItems.filter(
          (item) =>
            item.DOUId === itemId ||
            (item.DOUInvcaruniId === itemActual.DOUInvcaruniId &&
              lotesAdicionales.some(
                (l) =>
                  l.lote === item.DOULote &&
                  l.nroDocumento === item.DOUNroDocumento,
              )),
        );

        return {
          items: mapDispatchOrderUListToApi(itemsResultado),
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      } else {
        // No cambió cantidad, solo actualizar otros campos
        const productoTieneIva = Number(itemActual.invcaruni.CKIva) > 0;
        const cantidadActual = Number(itemActual.DOUCantidad);

        // Recalcular valores financieros
        // VrBruto = valor antes de descuento (cantidad × precio unitario)
        const valorBruto = cantidadActual * nuevoPrecioUnitario;

        // VrNeto = valor después de descuento + IVA
        let subtotalConDescuento = valorBruto;
        if (nuevoDescuento > 0) {
          const valorDescuento = nuevoPrecioUnitario * (nuevoDescuento / 100);
          const precioConDescuento = nuevoPrecioUnitario - valorDescuento;
          subtotalConDescuento = cantidadActual * precioConDescuento;
        }

        let valorIva = 0;
        if (productoTieneIva && nuevoTieneImpuesto) {
          valorIva =
            subtotalConDescuento * (Number(itemActual.invcaruni.CKIva) / 100);
        }

        const valorNeto = subtotalConDescuento + valorIva;

        // Actualizar item
        const itemActualizado = await tx.dispatchOrderU.update({
          where: {
            DOUId: itemId,
          },
          data: {
            DOUVrUnitario: nuevoPrecioUnitario,
            DOUDescuento: nuevoDescuento,
            DOUTieneImpuesto: nuevoTieneImpuesto,
            DOUDetalle: nuevoDetalle,
            DOUVrBruto: valorBruto,
            DOUVrNeto: valorNeto,
          },
          include: {
            invcaruni: true,
          },
        });

        // Manejar reservas después de actualizar el item (modo AUTOMATICO sin cambio de cantidad)
        if (!quiereReservar && tieneReserva) {
          // Liberar todas las reservas activas
          for (const reserva of reservasActivas) {
            await tx.inventoryReservation.update({
              where: { IRId: reserva.IRId },
              data: {
                IREstado: EstadoReserva.RELEASED,
                IRFechaLiberacion: new Date(),
                IRMotivo: "Reservation deactivated by user",
              },
            });
          }
          // Actualizar flag
          await tx.dispatchOrderU.update({
            where: { DOUId: itemId },
            data: { DOUReservado: false },
          });
        } else if (quiereReservar && !tieneReserva) {
          // Crear nueva reserva si no existe
          const loteFinal = itemActual.DOULote;
          if (loteFinal && itemActual.DOUNroDocumento) {
            await createReservationForItem(
              itemId,
              itemActual.DOUInvcaruniId,
              loteFinal,
              itemActual.DOUNroDocumento,
              cantidadActual,
              almacen.ALId,
              organizationId,
              usuario,
              tx,
            );
          }
        }

        await recalculateDispatchOrderTotals(tx, {
          dispatchOrderGId: dispatchOrder.DOGId,
          dispatchOrderNro: dispatchOrder.DOGNro,
          organizationId,
          updateWeightSnapshots: true,
        });

        return {
          items: mapDispatchOrderUListToApi([itemActualizado]),
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      }
    } else {
      // Modo manual: lot and document are read-only; use item actual values
      const nuevoLote = itemActual.DOULote;
      const nuevoNroDocumento = itemActual.DOUNroDocumento;

      // Validar stock del lote
      const kardex = await tx.kardex.findFirst({
        where: {
          KOrganizationId: organizationId,
          KInvcaruniId: itemActual.DOUInvcaruniId,
          KAlmacenId: almacen.ALId,
        },
      });

      if (!kardex) {
        throw new EntityNotFoundError("No kardex found for this product");
      }

      if (!nuevoLote || !nuevoNroDocumento) {
        throw new EntityValidationError(
          "Lot and document number are required for manual mode",
        );
      }

      const kardexLote = await tx.kardexLote.findFirst({
        where: {
          KLKardexId: kardex.KId,
          KLLote: nuevoLote,
          KLNroDocumento: nuevoNroDocumento,
          KLOrganizationId: organizationId,
        },
      });

      if (!kardexLote) {
        throw new EntityNotFoundError(
          `Lot ${nuevoLote} (Doc: ${nuevoNroDocumento}) not found for product ${itemActual.invcaruni.CKDescripcion}`,
        );
      }

      // Calculate available stock considering reservations (exclude current item's reservation)
      const reservedQty = await getReservedQuantityByLote(
        kardexLote.KLId,
        organizationId,
        tx,
        undefined, // excludeDispatchOrderGId
        itemActual.DOUId, // exclude this item's reservation
      );

      const siblingsInOrder = await tx.dispatchOrderU.findMany({
        where: {
          DOUOrganizationId: organizationId,
          DOUDispatchOrderGId: dispatchOrder.DOGId,
          DOUInvcaruniId: itemActual.DOUInvcaruniId,
          DOULote: nuevoLote,
          DOUNroDocumento: nuevoNroDocumento,
        },
        select: {
          DOUId: true,
          DOUInvcaruniId: true,
          DOULote: true,
          DOUNroDocumento: true,
          DOUCantidad: true,
        },
      });

      const onHand = Number(kardexLote.KLExistenciaFin);
      const existenciaDisponible = onHand - reservedQty;
      const requestedTotal = calculateRequestedTotalForLot({
        existingItems: siblingsInOrder.map((row) => ({
          ...row,
          DOUCantidad: Number(row.DOUCantidad),
        })),
        invcaruniId: itemActual.DOUInvcaruniId,
        lote: nuevoLote,
        nroDocumento: nuevoNroDocumento,
        requestedQuantity: nuevaCantidad,
        excludeItemId: itemActual.DOUId,
      });
      if (requestedTotal > existenciaDisponible) {
        throw new InsufficientStockError(
          `Not enough stock in lot ${nuevoLote} (Doc: ${nuevoNroDocumento}). Available: ${existenciaDisponible}, requested in this order: ${requestedTotal}.`,
        );
      }

      // Recalcular valores financieros
      const productoTieneIva = Number(itemActual.invcaruni.CKIva) > 0;
      // VrBruto = valor antes de descuento (cantidad × precio unitario)
      const valorBruto = nuevaCantidad * nuevoPrecioUnitario;

      // VrNeto = valor después de descuento + IVA
      let subtotalConDescuento = valorBruto;
      if (nuevoDescuento > 0) {
        const valorDescuento = nuevoPrecioUnitario * (nuevoDescuento / 100);
        const precioConDescuento = nuevoPrecioUnitario - valorDescuento;
        subtotalConDescuento = nuevaCantidad * precioConDescuento;
      }

      let valorIva = 0;
      if (productoTieneIva && nuevoTieneImpuesto) {
        valorIva =
          subtotalConDescuento * (Number(itemActual.invcaruni.CKIva) / 100);
      }

      const valorNeto = subtotalConDescuento + valorIva;

      // Preparar datos de actualización
      const updateDataFinal: Prisma.DispatchOrderUUpdateInput = {
        DOUCantidad: nuevaCantidad,
        DOUVrUnitario: nuevoPrecioUnitario,
        DOUDescuento: nuevoDescuento,
        DOUTieneImpuesto: nuevoTieneImpuesto,
        DOUDetalle: nuevoDetalle,
        DOUVrBruto: valorBruto,
        DOUVrNeto: valorNeto,
      };

      // En modo MANUAL, siempre preservar el lote (usar nuevoLote que ya tiene el valor correcto)
      // nuevoLote y nuevoNroDocumento se calculan arriba
      updateDataFinal.DOULote = nuevoLote;
      updateDataFinal.DOUNroDocumento = nuevoNroDocumento;

      // Actualizar item
      const itemActualizado = await tx.dispatchOrderU.update({
        where: {
          DOUId: itemId,
        },
        data: updateDataFinal,
        include: {
          invcaruni: true,
        },
      });

      // Manejar reservas después de actualizar el item
      if (!quiereReservar && tieneReserva) {
        // Liberar todas las reservas activas
        for (const reserva of reservasActivas) {
          await tx.inventoryReservation.update({
            where: { IRId: reserva.IRId },
            data: {
              IREstado: EstadoReserva.RELEASED,
              IRFechaLiberacion: new Date(),
              IRMotivo: "Reserva desactivada por usuario",
            },
          });
        }
        // Actualizar flag
        await tx.dispatchOrderU.update({
          where: { DOUId: itemId },
          data: { DOUReservado: false },
        });
      } else if (quiereReservar) {
        const loteFinal = nuevoLote ?? itemActual.DOULote;
        const nroDocumentoFinal =
          nuevoNroDocumento ?? itemActual.DOUNroDocumento;

        if (!loteFinal || !nroDocumentoFinal) {
          throw new EntityValidationError(
            "Lot and document number are required to create reservation",
          );
        }

        if (tieneReserva && reservasActivas[0]) {
          // Actualizar cantidad de reserva existente si cambió
          const reserva = reservasActivas[0];
          if (updateData.DOUCantidad !== undefined) {
            const kardexLoteId = reserva.IRKardexLoteId;
            const kardexLote = await tx.kardexLote.findUnique({
              where: { KLId: kardexLoteId },
            });

            if (!kardexLote) {
              throw new EntityNotFoundError("KardexLote not found");
            }

            const reservedQty = await getReservedQuantityByLote(
              kardexLoteId,
              organizationId,
              tx,
              undefined, // excludeDispatchOrderGId
              itemId, // exclude this item's reservation
            );
            const onHand = Number(kardexLote.KLExistenciaFin);
            const existenciaDisponible = onHand - reservedQty;

            if (nuevaCantidad > existenciaDisponible) {
              throw new InsufficientStockError(
                `Not enough stock for this item. Requested: ${nuevaCantidad}, available: ${existenciaDisponible}.`,
              );
            }

            await tx.inventoryReservation.update({
              where: { IRId: reserva.IRId },
              data: {
                IRCantidadReservada: nuevaCantidad,
              },
            });
          }
        } else {
          // Crear nueva reserva
          await createReservationForItem(
            itemId,
            itemActual.DOUInvcaruniId,
            loteFinal,
            nroDocumentoFinal,
            nuevaCantidad,
            almacen.ALId,
            organizationId,
            usuario,
            tx,
          );
        }
      }

      await recalculateDispatchOrderTotals(tx, {
        dispatchOrderGId: dispatchOrder.DOGId,
        dispatchOrderNro: dispatchOrder.DOGNro,
        organizationId,
        updateWeightSnapshots: true,
      });

      return {
        items: mapDispatchOrderUListToApi([itemActualizado]),
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }
  });
};

/**
 * Elimina un item específico de una dispatch order
 */
export const deleteDispatchOrderItem = async (
  dispatchOrderId: number,
  itemId: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DRAFT) {
      throw new EntityValidationError(
        "Can only delete items from DRAFT dispatch orders",
      );
    }

    // 2. Validar item
    const item = await tx.dispatchOrderU.findUnique({
      where: {
        DOUId: itemId,
      },
    });

    if (!item) {
      throw new EntityNotFoundError("Item not found");
    }

    if (
      item.DOUNro !== dispatchOrder.DOGNro ||
      item.DOUOrganizationId !== organizationId
    ) {
      throw new EntityValidationError(
        "Item does not belong to this dispatch order",
      );
    }

    // 3. Eliminar TODAS las reservas asociadas antes de eliminar el item
    // (necesario para evitar FK constraint)
    await tx.inventoryReservation.deleteMany({
      where: {
        IRDispatchOrderUId: itemId,
      },
    });

    // 4. Eliminar item
    await tx.dispatchOrderU.delete({
      where: {
        DOUId: itemId,
      },
    });

    await recalculateDispatchOrderTotals(tx, {
      dispatchOrderGId: dispatchOrder.DOGId,
      dispatchOrderNro: dispatchOrder.DOGNro,
      organizationId,
      updateWeightSnapshots: true,
    });
  });
};

/**
 * Elimina una dispatch order en estado DRAFT
 */
export const deleteDispatchOrder = async (
  id: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: id,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DRAFT) {
      throw new EntityValidationError("Can only delete DRAFT dispatch orders");
    }

    // Eliminar items primero
    await tx.dispatchOrderU.deleteMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
      },
    });

    // Eliminar dispatch order
    await tx.dispatchOrderG.delete({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: id,
        },
      },
    });
  });
};

/**
 * Actualiza la cantidad devuelta de un item (temporal para tiempo real)
 * Solo permite actualizar cuando el dispatch está en estado DISPATCHED
 */
export const updateCantidadDevuelta = async (
  dispatchOrderId: number,
  itemId: number,
  cantidadDevuelta: number,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    // 2. Validar que esté en estado DISPATCHED
    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DISPATCHED) {
      throw new EntityValidationError(
        "Can only update returned quantity for DISPATCHED dispatch orders",
      );
    }

    // 3. Obtener item actual
    const itemActual = await tx.dispatchOrderU.findUnique({
      where: {
        DOUId: itemId,
      },
    });

    if (!itemActual) {
      throw new EntityNotFoundError("Item not found");
    }

    if (
      itemActual.DOUNro !== dispatchOrder.DOGNro ||
      itemActual.DOUOrganizationId !== organizationId
    ) {
      throw new EntityValidationError(
        "Item does not belong to this dispatch order",
      );
    }

    // 4. Validar que cantidad devuelta no exceda cantidad despachada
    const cantidadDespachada = Number(itemActual.DOUCantidad);
    if (cantidadDevuelta > cantidadDespachada) {
      throw new EntityValidationError(
        `Returned quantity (${cantidadDevuelta}) cannot exceed dispatched quantity (${cantidadDespachada})`,
      );
    }

    // 5. Actualizar cantidad devuelta
    await tx.dispatchOrderU.update({
      where: {
        DOUId: itemId,
      },
      data: {
        usuario,
        creadoOModificado: new Date(),
      },
    });

    // 6. Obtener items actualizados
    const items = await tx.dispatchOrderU.findMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
      },
      include: {
        invcaruni: {
          include: {
            grupo: true,
            unidadDeMedida: true,
          },
        },
      },
      orderBy: [
        { invcaruni: { CKDescripcion: "asc" } },
        { DOULote: "asc" },
        { DOUId: "asc" },
      ],
    });

    return mapDispatchOrderUListToApi(items);
  });
};

/**
 * Obtiene los movimientos de salida (Movkar) para un dispatch order
 * Estos movimientos se crearon al emitir el dispatch order
 */
export const obtenerMovimientosSalida = async (
  dispatchOrderId: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Obtener dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    // 2. Obtener tipo de movimiento de salida para facturas
    const tipoMovimientoSalida = await obtenerTipoMovimientoFactura(
      organizationId,
      tx,
    );

    // 3. Buscar movimientos de salida por número de documento
    const movimientos = await tx.movkar.findMany({
      where: {
        MVOrganizationId: organizationId,
        MVNroDocumento: dispatchOrder.DOGNro.toString(),
        MVTipoMovimientoId: tipoMovimientoSalida.TId,
        MVClienteId: dispatchOrder.DOGClienteId,
      },
      include: {
        invcaruni: {
          select: {
            CKId: true,
            CKDescripcion: true,
          },
        },
      },
      orderBy: { MVSecuencial: "asc" },
    });

    return movimientos;
  });
};

/**
 * Obtiene los items de un dispatch order que están disponibles para devolución
 * Solo disponible para dispatch orders en estado DISPATCHED
 * Calcula: cantidad disponible = cantidad original - cantidad ya devuelta
 */
export const obtenerItemsDisponiblesParaDevolucion = async (
  dispatchOrderId: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    // 2. Validar que esté en estado DISPATCHED o EMITTED
    if (
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.DISPATCHED &&
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.EMITTED
    ) {
      throw new EntityValidationError(
        "Returns can only be created for DISPATCHED or EMITTED dispatch orders",
      );
    }

    // 3. Obtener tipo de movimiento de salida (para identificar items originales)
    const tipoMovimientoSalida = await obtenerTipoMovimientoFactura(
      organizationId,
      tx,
    );

    // 4. Obtener items originales (solo items de salida, no devoluciones)
    const itemsOriginales = await tx.dispatchOrderU.findMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUTipoMovimientoId: tipoMovimientoSalida.TId, // Solo items de salida
      },
      include: {
        invcaruni: {
          include: {
            grupo: true,
            unidadDeMedida: true,
          },
        },
      },
      orderBy: [
        { invcaruni: { CKDescripcion: "asc" } },
        { DOULote: "asc" },
        { DOUId: "asc" },
      ],
    });

    // 5. Obtener tipo de movimiento de entrada para devoluciones
    const tipoMovimientoEntrada = await obtenerTipoMovimientoDevolucion(
      organizationId,
      tx,
    );

    // 6. Obtener items de devolución existentes (para calcular cantidad ya devuelta)
    const itemsDevolucion = await tx.dispatchOrderU.findMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUTipoMovimientoId: tipoMovimientoEntrada.TId,
      },
    });

    const devolucionesAsignadasPorDOUId = sumReturnsByOriginalItemId(
      itemsOriginales
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUId: item.DOUId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
      itemsDevolucion
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUOriginalItemId:
            (item as { DOUOriginalItemId?: null | number }).DOUOriginalItemId ??
            null,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
    );

    // 8. Calcular cantidad disponible para cada item original
    const itemsDisponibles = itemsOriginales
      .map((item) => {
        if (!item.DOULote || !item.DOUNroDocumento) {
          return null; // Items sin lote o documento no se pueden devolver
        }

        const cantidadYaDevuelta =
          devolucionesAsignadasPorDOUId.get(item.DOUId) ?? 0;
        const cantidadDisponible =
          Number(item.DOUCantidad) - cantidadYaDevuelta;

        // Solo incluir items que tienen cantidad disponible > 0
        if (cantidadDisponible <= 0) {
          return null;
        }

        return {
          DOUId: item.DOUId,
          producto: {
            CKId: item.invcaruni.CKId,
            CKDescripcion: item.invcaruni.CKDescripcion,
            CKPesoPromedioKg: item.invcaruni.CKPesoPromedioKg,
            grupo: item.invcaruni.grupo,
            unidadDeMedida: item.invcaruni.unidadDeMedida,
          },
          lote: item.DOULote,
          loteDocumento: item.DOUNroDocumento,
          cantidadOriginal: item.DOUCantidad,
          cantidadYaDevuelta,
          cantidadDisponible,
          precioUnitario: item.DOUVrUnitario,
          tieneImpuesto: item.DOUTieneImpuesto,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return itemsDisponibles;
  });
};

/**
 * Crea items de devolución en un dispatch order y crea los movimientos de inventario inmediatamente
 * Solo disponible para dispatch orders en estado DISPATCHED
 * Al confirmar se crean los items Y los movimientos de entrada
 */
export const crearDevoluciones = async (
  dispatchOrderId: number,
  devoluciones: {
    DOUCantidad: number; // Cantidad a devolver
    DOUId: number; // ID del item original
  }[],
  organizationId: string,
  usuario: string,
) => {
  const fechaDevolucion = new Date();
  const targetPeriod = periodFromDate(fechaDevolucion);
  await assertPriorPeriodsClosed(organizationId, targetPeriod);

  return prisma.$transaction(async (tx) => {
    // 1. Validar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    const wasEmittedAtReturnStart =
      dispatchOrder.DOGEstado === EstadoDispatchOrder.EMITTED;

    // 2. Validar que esté en estado DISPATCHED o EMITTED
    if (
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.DISPATCHED &&
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.EMITTED
    ) {
      throw new EntityValidationError(
        "Returns can only be created for DISPATCHED or EMITTED dispatch orders",
      );
    }

    // 3. Obtener tipos de movimiento
    const tipoMovimientoSalida = await obtenerTipoMovimientoFactura(
      organizationId,
      tx,
    );
    const tipoMovimientoEntrada = await obtenerTipoMovimientoDevolucion(
      organizationId,
      tx,
    );

    // 4. Obtener almacén
    const almacen = await obtenerAlmacenParaFactura(organizationId, tx);

    // 5. Obtener items originales y validar
    const itemsOriginales = await tx.dispatchOrderU.findMany({
      where: {
        DOUId: { in: devoluciones.map((d) => d.DOUId) },
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUTipoMovimientoId: tipoMovimientoSalida.TId,
      },
      include: {
        invcaruni: true,
      },
    });

    if (itemsOriginales.length !== devoluciones.length) {
      throw new EntityNotFoundError(
        "Some items were not found or are not valid",
      );
    }

    // 6. Obtener devoluciones existentes para calcular cantidad disponible
    const itemsDevolucionExistentes = await tx.dispatchOrderU.findMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUTipoMovimientoId: tipoMovimientoEntrada.TId,
      },
    });

    const devolucionesAsignadasPorDOUId = sumReturnsByOriginalItemId(
      itemsOriginales
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUId: item.DOUId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
      itemsDevolucionExistentes
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUOriginalItemId:
            (item as { DOUOriginalItemId?: null | number }).DOUOriginalItemId ??
            null,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
    );

    // 7. Validar y preparar items de devolución
    const itemsACrear: {
      DOUCantidad: number;
      DOUCostoPromedio: number;
      DOUDescuento: number;
      DOUDetalle: string;
      DOUDispatchOrderGId: number;
      DOUInvcaruniId: number;
      DOULote: string;
      DOUModoSalida: "MANUAL";
      DOUNro: number;
      DOUNroDocumento: string;
      DOUOrganizationId: string;
      DOUOriginalItemId: number;
      DOUReservado: boolean;
      DOUTieneImpuesto: boolean;
      DOUTipoMovimientoId: number;
      DOUVrBruto: number;
      DOUVrNeto: number;
      DOUVrUnitario: number;
      usuario: string;
    }[] = [];

    const movimientosACrear: {
      cantidad: number;
      itemOriginal: (typeof itemsOriginales)[0];
      lote: string;
    }[] = [];

    for (const devolucion of devoluciones) {
      const itemOriginal = itemsOriginales.find(
        (item) => item.DOUId === devolucion.DOUId,
      );

      if (!itemOriginal) {
        throw new EntityNotFoundError(
          `Original item ${devolucion.DOUId} not found`,
        );
      }

      if (!itemOriginal.DOULote || !itemOriginal.DOUNroDocumento) {
        throw new EntityValidationError(
          `Item ${itemOriginal.invcaruni.CKDescripcion} does not have a lot and document number assigned`,
        );
      }

      // Validar cantidad disponible
      const cantidadYaDevuelta =
        devolucionesAsignadasPorDOUId.get(itemOriginal.DOUId) ?? 0;
      const cantidadDisponible =
        Number(itemOriginal.DOUCantidad) - cantidadYaDevuelta;

      if (devolucion.DOUCantidad > cantidadDisponible) {
        throw new EntityValidationError(
          `Return quantity (${devolucion.DOUCantidad}) exceeds available quantity (${cantidadDisponible}) for product ${itemOriginal.invcaruni.CKDescripcion}, lot ${itemOriginal.DOULote} (Doc: ${itemOriginal.DOUNroDocumento})`,
        );
      }

      if (devolucion.DOUCantidad <= 0) {
        throw new EntityValidationError(
          `Return quantity must be greater than 0 for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      // Calcular valores financieros (usar los mismos del item original)
      const precioUnitario = Number(itemOriginal.DOUVrUnitario);
      const descuento = Number(itemOriginal.DOUDescuento);
      const productoTieneIva = Number(itemOriginal.invcaruni.CKIva) > 0;

      const precioBruto = devolucion.DOUCantidad * precioUnitario;
      let subtotalNeto = precioBruto;
      if (descuento > 0) {
        const valorDescuento = precioUnitario * (descuento / 100);
        const precioConDescuento = precioUnitario - valorDescuento;
        subtotalNeto = devolucion.DOUCantidad * precioConDescuento;
      }

      let valorIva = 0;
      if (productoTieneIva && itemOriginal.DOUTieneImpuesto) {
        valorIva = subtotalNeto * (Number(itemOriginal.invcaruni.CKIva) / 100);
      }

      const precioNeto = subtotalNeto + valorIva;

      itemsACrear.push({
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUInvcaruniId: itemOriginal.DOUInvcaruniId,
        DOUDispatchOrderGId: dispatchOrder.DOGId,
        DOUTipoMovimientoId: tipoMovimientoEntrada.TId, // Tipo de entrada
        DOUCantidad: devolucion.DOUCantidad,
        DOUVrBruto: -precioBruto, // NEGATIVO para que reste del total
        DOUVrNeto: -precioNeto, // NEGATIVO para que reste del total
        DOUVrUnitario: precioUnitario, // Already converted to number above
        DOUDescuento: descuento, // Already converted to number above
        DOUTieneImpuesto: itemOriginal.DOUTieneImpuesto,
        DOUDetalle: `Return of item ${itemOriginal.invcaruni.CKDescripcion}`,
        DOUReservado: false,
        DOULote: itemOriginal.DOULote,
        DOUNroDocumento: itemOriginal.DOUNroDocumento,
        DOUModoSalida: "MANUAL",
        DOUOriginalItemId: itemOriginal.DOUId,
        DOUCostoPromedio: Number(itemOriginal.DOUCostoPromedio),
        usuario,
      });

      // Guardar información para crear movimientos
      movimientosACrear.push({
        itemOriginal,
        cantidad: devolucion.DOUCantidad,
        lote: itemOriginal.DOULote,
      });
    }

    // 8. Crear items de devolución
    await tx.dispatchOrderU.createMany({
      data: itemsACrear,
    });

    // 9. Crear movimientos de inventario de ENTRADA inmediatamente
    for (const movimiento of movimientosACrear) {
      const { itemOriginal, cantidad, lote } = movimiento;

      // Validar kardex y lote
      const kardex = await tx.kardex.findFirst({
        where: {
          KOrganizationId: organizationId,
          KInvcaruniId: itemOriginal.DOUInvcaruniId,
          KAlmacenId: almacen.ALId,
        },
      });

      if (!kardex) {
        throw new EntityNotFoundError(
          `No kardex found for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      // Find KardexLote by lot AND document number (from the original dispatch order item)
      const kardexLote = await tx.kardexLote.findFirst({
        where: {
          KLKardexId: kardex.KId,
          KLLote: itemOriginal.DOULote,
          KLNroDocumento: itemOriginal.DOUNroDocumento, // From original dispatch order item
          KLOrganizationId: organizationId,
        },
      });

      if (!kardexLote) {
        throw new EntityNotFoundError(
          `Lot ${lote} not found for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      // Calcular MVImpuesto
      const mvImpuesto = itemOriginal.DOUTieneImpuesto
        ? Number(itemOriginal.invcaruni.CKIva)
        : 0;

      // Crear movimiento de ENTRADA
      await crearMovimientoConTx(
        tx,
        {
          MVTipoMovimientoId: tipoMovimientoEntrada.TId,
          MVCantidad: cantidad,
          MVClienteId: null,
          MVProveedorId: null,
          MVNroDocumento: dispatchOrder.DOGNro.toString(),
          MVFecha: fechaDevolucion,
          MVCostoPrecio: Number(itemOriginal.DOUVrUnitario),
          // Use historical dispatch cost stored on the original dispatch item.
          MVCostoSalida: Number(itemOriginal.DOUCostoPromedio),
          MVDescuento: Number(itemOriginal.DOUDescuento),
          MVImpuesto: mvImpuesto,
          MVEsCostoTemporalCero: false,
          MVLote: lote,
          MVLoteNroDocumento: itemOriginal.DOUNroDocumento,
          invcaruniId: itemOriginal.DOUInvcaruniId,
          almacenId: almacen.ALId,
          organizationId: organizationId,
          ciudadId: kardexLote.KLCiudadId,
        },
        usuario,
        true, // Activar opcion de devolucion
        targetPeriod,
      );
    }

    // 10. Recalcular totales del dispatch order
    // Recalcular snapshots de peso solo cuando la devolucion inicia en EMITTED.
    // En DISPATCHED se preserva el snapshot historico existente.
    const todosLosItems = await recalculateDispatchOrderTotals(tx, {
      dispatchOrderGId: dispatchOrder.DOGId,
      dispatchOrderNro: dispatchOrder.DOGNro,
      organizationId,
      updateWeightSnapshots: wasEmittedAtReturnStart,
    });

    // 10.5. Check if all items are fully returned and mark as ANULATED if so
    // Reuse todosLosItems instead of fetching again
    const todosLosItemsOriginales = todosLosItems.filter(
      (item) => item.DOUTipoMovimientoId === tipoMovimientoSalida.TId,
    );

    const todosLosItemsDevolucion = todosLosItems.filter(
      (item) => item.DOUTipoMovimientoId === tipoMovimientoEntrada.TId,
    );

    // Group returns by product+lote+document to calculate total returned per item
    const devolucionesAsignadasCheckPorDOUId = sumReturnsByOriginalItemId(
      todosLosItemsOriginales
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUId: item.DOUId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
      todosLosItemsDevolucion
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUOriginalItemId:
            (item as { DOUOriginalItemId?: null | number }).DOUOriginalItemId ??
            null,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
    );

    // Check if all original items are fully returned
    let allItemsFullyReturned = true;
    for (const itemOriginal of todosLosItemsOriginales) {
      // Skip items without lot/document (they can't be returned)
      if (!itemOriginal.DOULote || !itemOriginal.DOUNroDocumento) {
        continue; // These items don't count towards cancellation check
      }

      const cantidadDevuelta =
        devolucionesAsignadasCheckPorDOUId.get(itemOriginal.DOUId) ?? 0;
      const cantidadOriginal = Number(itemOriginal.DOUCantidad);

      // If any item is not fully returned, set flag to false
      if (cantidadDevuelta < cantidadOriginal) {
        allItemsFullyReturned = false;
        break;
      }
    }

    // If all items are fully returned, mark dispatch order as ANULATED
    if (allItemsFullyReturned && todosLosItemsOriginales.length > 0) {
      await tx.dispatchOrderG.update({
        where: { DOGId: dispatchOrder.DOGId },
        data: {
          DOGEstado: EstadoDispatchOrder.ANULATED,
          DOGEmittedPdfNeedsWarehouseRefresh: false,
        },
      });
    } else if (wasEmittedAtReturnStart) {
      await tx.dispatchOrderG.update({
        where: { DOGId: dispatchOrder.DOGId },
        data: { DOGEmittedPdfNeedsWarehouseRefresh: true },
      });
    }

    // 11. Retornar items creados
    const itemsCreados = await tx.dispatchOrderU.findMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUTipoMovimientoId: tipoMovimientoEntrada.TId,
      },
      include: {
        invcaruni: true,
      },
      orderBy: { DOUId: "desc" },
      take: itemsACrear.length,
    });

    return mapDispatchOrderUListToApi(itemsCreados);
  });
};

/**
 * Anula una dispatch order (EMITTED o DISPATCHED -> ANULATED)
 * Crea movimientos de entrada para revertir todos los movimientos de salida
 * No recalcula el costo promedio
 */
export const anularDispatchOrder = async (
  dispatchOrderId: number,
  organizationId: string,
  usuario: string,
  razonAnulacion?: string,
) => {
  const fechaAnulacion = new Date();
  const targetPeriod = periodFromDate(fechaAnulacion);
  await assertPriorPeriodsClosed(organizationId, targetPeriod);

  return prisma.$transaction(async (tx) => {
    // 1. Validar dispatch order
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: organizationId,
          DOGOrgSecuencia: dispatchOrderId,
        },
      },
      include: {
        dispatchOrderU: {
          include: {
            invcaruni: {
              include: {
                grupo: true,
                unidadDeMedida: true,
              },
            },
            tipoMovimiento: true,
          },
        },
      },
    });

    if (!dispatchOrder) {
      throw new EntityNotFoundError("Dispatch order not found");
    }

    // 2. Validar que esté en estado EMITTED o DISPATCHED
    if (
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.EMITTED &&
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.DISPATCHED &&
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.ANULATED
    ) {
      throw new EntityValidationError(
        "Only EMITTED or DISPATCHED dispatch orders can be annulled",
      );
    }

    // 4. Obtener tipos de movimiento
    const tipoMovimientoSalida = await obtenerTipoMovimientoFactura(
      organizationId,
      tx,
    );
    const tipoMovimientoEntrada = await obtenerTipoMovimientoAnulacion(
      organizationId,
      tx,
    );

    // 5. Obtener almacén
    const almacen = await obtenerAlmacenParaFactura(organizationId, tx);

    // 6. Obtener items originales (solo items de salida, no devoluciones)
    const itemsOriginales = dispatchOrder.dispatchOrderU.filter(
      (item) =>
        item.tipoMovimiento.TTipo === 2 && // Exit type
        item.tipoMovimiento.TProposito === TipoPropositoMovkar.DISPATCH_ORDER,
    );

    if (itemsOriginales.length === 0) {
      throw new EntityValidationError("No original items found to annul");
    }

    // 7. Obtener items de devolución existentes para calcular cantidad ya devuelta
    const itemsDevolucion = dispatchOrder.dispatchOrderU.filter(
      (item) =>
        item.tipoMovimiento.TProposito ===
        TipoPropositoMovkar.DISPATCH_ORDER_DEVOLUCION,
    );

    const devolucionesAsignadasPorDOUId = sumReturnsByOriginalItemId(
      itemsOriginales
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUId: item.DOUId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
      itemsDevolucion
        .filter((item) => item.DOULote && item.DOUNroDocumento)
        .map((item) => ({
          DOUOriginalItemId:
            (item as { DOUOriginalItemId?: null | number }).DOUOriginalItemId ??
            null,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
    );

    // 9. Calcular items para anular (solo los que tienen cantidad restante)
    const itemsParaAnular: {
      cantidadRestante: number;
      itemOriginal: (typeof itemsOriginales)[0];
      movimientoSalida?: { MVCostoSalida: null | number | Prisma.Decimal };
    }[] = [];

    for (const item of itemsOriginales) {
      if (!item.DOULote || !item.DOUNroDocumento) {
        // Items without lot/document can't be annulled (shouldn't happen for EMITTED/DISPATCHED)
        continue;
      }

      const cantidadYaDevuelta =
        devolucionesAsignadasPorDOUId.get(item.DOUId) ?? 0;
      const cantidadRestante = Number(item.DOUCantidad) - cantidadYaDevuelta;

      if (cantidadRestante > 0) {
        itemsParaAnular.push({
          itemOriginal: item,
          cantidadRestante,
        });
      }
    }

    if (itemsParaAnular.length === 0) {
      throw new EntityValidationError(
        "All items have already been returned. Nothing to annul.",
      );
    }

    // 10. Obtener movimientos de salida originales para obtener el costo
    const movimientosSalida = await tx.movkar.findMany({
      where: {
        MVOrganizationId: organizationId,
        MVNroDocumento: dispatchOrder.DOGNro.toString(),
        MVTipoMovimientoId: tipoMovimientoSalida.TId,
        MVClienteId: dispatchOrder.DOGClienteId,
      },
    });

    // Crear colas de movimientos por producto+lote+documento para asignacion 1:1 deterministica
    const movimientosPorItem = new Map<
      string,
      (typeof movimientosSalida)[0][]
    >();
    for (const movimiento of movimientosSalida) {
      const key = `${movimiento.MVInvcaruniId}-${movimiento.MVLote}-${movimiento.MVLoteNroDocumento || ""}`;
      const rows = movimientosPorItem.get(key) ?? [];
      rows.push(movimiento);
      movimientosPorItem.set(key, rows);
    }
    for (const rows of movimientosPorItem.values()) {
      rows.sort((a, b) => a.MVId - b.MVId);
    }

    const itemsParaAnularOrdenados = [...itemsParaAnular].sort(
      (a, b) => a.itemOriginal.DOUId - b.itemOriginal.DOUId,
    );
    for (const item of itemsParaAnularOrdenados) {
      const key = `${item.itemOriginal.DOUInvcaruniId}-${item.itemOriginal.DOULote}-${item.itemOriginal.DOUNroDocumento}`;
      const queue = movimientosPorItem.get(key) ?? [];
      const movimientoSalida = queue.shift();
      if (!movimientoSalida) {
        throw new EntityNotFoundError(
          `Original exit movement not found for item ${item.itemOriginal.invcaruni.CKDescripcion}, lot ${item.itemOriginal.DOULote}`,
        );
      }
      item.movimientoSalida = movimientoSalida;
      movimientosPorItem.set(key, queue);
    }

    // 11. Crear DispatchOrderU items de devolución (con valores negativos)
    const itemsACrear = [];

    for (const { itemOriginal, cantidadRestante } of itemsParaAnularOrdenados) {
      // Calcular valores financieros (similar a crearDevoluciones)
      const precioUnitario = Number(itemOriginal.DOUVrUnitario);
      const descuento = Number(itemOriginal.DOUDescuento);
      const productoTieneIva = Number(itemOriginal.invcaruni.CKIva) > 0;

      const precioBruto = cantidadRestante * precioUnitario;
      let subtotalNeto = precioBruto;
      if (descuento > 0) {
        const valorDescuento = precioUnitario * (descuento / 100);
        const precioConDescuento = precioUnitario - valorDescuento;
        subtotalNeto = cantidadRestante * precioConDescuento;
      }

      let valorIva = 0;
      if (productoTieneIva && itemOriginal.DOUTieneImpuesto) {
        valorIva = subtotalNeto * (Number(itemOriginal.invcaruni.CKIva) / 100);
      }

      const precioNeto = subtotalNeto + valorIva;

      itemsACrear.push({
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: organizationId,
        DOUInvcaruniId: itemOriginal.DOUInvcaruniId,
        DOUDispatchOrderGId: dispatchOrder.DOGId,
        DOUTipoMovimientoId: tipoMovimientoEntrada.TId, // Tipo de entrada
        DOUCantidad: cantidadRestante,
        DOUVrBruto: -precioBruto, // NEGATIVO para que reste del total
        DOUVrNeto: -precioNeto, // NEGATIVO para que reste del total
        DOUVrUnitario: precioUnitario,
        DOUDescuento: descuento,
        DOUTieneImpuesto: itemOriginal.DOUTieneImpuesto,
        DOUDetalle: razonAnulacion
          ? `Annulment of dispatch order ${dispatchOrder.DOGNro}. Reason: ${razonAnulacion}`
          : `Annulment of dispatch order ${dispatchOrder.DOGNro}`,
        DOUReservado: false,
        DOULote: itemOriginal.DOULote,
        DOUNroDocumento: itemOriginal.DOUNroDocumento,
        DOUModoSalida: "MANUAL" as const,
        DOUOriginalItemId: itemOriginal.DOUId,
        DOUCostoPromedio: Number(itemOriginal.DOUCostoPromedio),
        usuario,
      });
    }

    // 12. Crear items de devolución
    await tx.dispatchOrderU.createMany({
      data: itemsACrear,
    });

    // 13. Crear movimientos de entrada para cada item restante
    for (const {
      itemOriginal,
      cantidadRestante,
      movimientoSalida,
    } of itemsParaAnularOrdenados) {
      // Validar que el item tenga lote (ya validado arriba, pero por seguridad)
      if (!itemOriginal.DOULote || !itemOriginal.DOUNroDocumento) {
        throw new EntityValidationError(
          `Item ${itemOriginal.invcaruni.CKDescripcion} does not have a lot and document assigned`,
        );
      }

      if (!movimientoSalida) {
        throw new EntityNotFoundError(
          `Original exit movement not found for item ${itemOriginal.invcaruni.CKDescripcion}, lot ${itemOriginal.DOULote}`,
        );
      }

      // Validar kardex y lote
      const kardex = await tx.kardex.findFirst({
        where: {
          KOrganizationId: organizationId,
          KInvcaruniId: itemOriginal.DOUInvcaruniId,
          KAlmacenId: almacen.ALId,
        },
      });

      if (!kardex) {
        throw new EntityNotFoundError(
          `No kardex found for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      const kardexLote = await tx.kardexLote.findFirst({
        where: {
          KLKardexId: kardex.KId,
          KLLote: itemOriginal.DOULote,
          KLNroDocumento: itemOriginal.DOUNroDocumento,
          KLOrganizationId: organizationId,
        },
      });

      if (!kardexLote) {
        throw new EntityNotFoundError(
          `Lot ${itemOriginal.DOULote} (Doc: ${itemOriginal.DOUNroDocumento}) not found for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      // Calcular MVImpuesto
      const mvImpuesto = itemOriginal.DOUTieneImpuesto
        ? Number(itemOriginal.invcaruni.CKIva)
        : 0;

      // Usar el costo de salida original (MVCostoSalida) para la entrada
      // Esto evita recalcular el costo promedio
      const costoSalidaOriginal = Number(movimientoSalida.MVCostoSalida);

      // Crear movimiento de ENTRADA usando el mismo costo de salida
      await crearMovimientoConTx(
        tx,
        {
          MVTipoMovimientoId: tipoMovimientoEntrada.TId,
          MVCantidad: cantidadRestante, // Usar cantidad restante, no la original
          MVClienteId: null,
          MVProveedorId: null,
          MVNroDocumento: dispatchOrder.DOGNro.toString(),
          MVFecha: fechaAnulacion,
          MVCostoPrecio: Number(itemOriginal.DOUVrUnitario),
          MVCostoSalida: costoSalidaOriginal, // Usar el costo original de salida
          MVDescuento: Number(itemOriginal.DOUDescuento),
          MVImpuesto: mvImpuesto,
          MVEsCostoTemporalCero: false,
          MVLote: itemOriginal.DOULote,
          MVLoteNroDocumento: itemOriginal.DOUNroDocumento,
          invcaruniId: itemOriginal.DOUInvcaruniId,
          almacenId: almacen.ALId,
          organizationId: organizationId,
          ciudadId: kardexLote.KLCiudadId,
        },
        usuario,
        true, // devolucionDeCliente = true para usar DISPATCH_ORDER_DEVOLUCION
        targetPeriod,
      );
    }

    // 15. Actualizar estado del dispatch order a ANULATED y recalcular totales
    await tx.dispatchOrderG.update({
      where: { DOGId: dispatchOrder.DOGId },
      data: {
        DOGEstado: EstadoDispatchOrder.ANULATED,
        DOGEmittedPdfNeedsWarehouseRefresh: false,
        DOGValorTotalBruto: 0,
        DOGTotalDescuento: 0,
        DOGTotalIVA: 0,
        DOGValorTotalNeto: 0,
        creadoOModificado: fechaAnulacion,
        usuario,
      },
    });

    // 16. Obtener el dispatch order actualizado para retornar
    const dispatchOrderAnulado = await tx.dispatchOrderG.findUnique({
      where: { DOGId: dispatchOrder.DOGId },
      include: {
        cltemae: true,
        vendedor: true,
        ciudad: {
          include: {
            estado: {
              include: {
                pais: true,
              },
            },
          },
        },
        dispatchOrderU: {
          include: {
            tipoMovimiento: true,
            invcaruni: {
              include: {
                grupo: true,
                unidadDeMedida: true,
              },
            },
          },
          orderBy: [
            { invcaruni: { CKDescripcion: "asc" } },
            { DOULote: "asc" },
            { DOUId: "asc" },
          ],
        },
      },
    });

    if (!dispatchOrderAnulado) {
      throw new EntityNotFoundError("Dispatch order not found after annulment");
    }

    return mapDispatchOrderGToApi(dispatchOrderAnulado);
  });
};
