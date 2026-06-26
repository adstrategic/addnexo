import {
  EstadoDispatchOrder,
  EstadoFactura,
  prisma,
  Prisma,
  TipoPropositoMovkar,
} from "@repo/db";

import type {
  CrearFacturaDto,
  RegistrarNotaCreditoConDevolucionDto,
  RegistrarNotaCreditoDto,
  RegistrarNotaDebitoDto,
  RegistrarPagoDto,
} from "./invoices.validator.js";

import {
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";
import { outboxProcessQueue } from "../../queue/queues.js";
import { sumReturnsByOriginalItemId } from "../dispatch-order/dispatch-order.utils.js";
import {
  crearMovimientoConTx,
  obtenerCostoPromedioProducto,
} from "../movkar/movkar.service.js";
import {
  assertPriorPeriodsClosed,
  periodFromDate,
} from "../period/period.service.js";
import { mapFacturaGToApi } from "./invoices.mapper.js";
import { sumFacturaReturnsByOriginalItemId } from "./invoices.utils.js";

// ===== SERVICIOS DE LISTADO Y CONSULTA =====

interface ListFacturasOptions {
  clienteId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  estado?: EstadoFactura;
  limit: number;
  page: number;
  search?: string;
  organizationId: string;
  vendedorId?: number;
}

/**
 * Lista todas las facturas con paginación y filtros
 */
export const listFacturas = async (options: ListFacturasOptions) => {
  const {
    page,
    limit,
    search,
    estado,
    clienteId,
    vendedorId,
    dateFrom,
    dateTo,
    organizationId,
  } = options;

  const skip = (page - 1) * limit;

  const where: Prisma.FacturagWhereInput = {
    FGOrganizationId: organizationId,
  };

  if (estado) {
    where.FGEstado = estado as EstadoFactura;
  }

  if (clienteId) {
    where.FGClienteId = clienteId;
  }

  if (vendedorId) {
    where.FGVendedorId = vendedorId;
  }

  // Date range: match if EITHER issue date OR due date falls in range
  let dateOrConditions: Prisma.FacturagWhereInput[] | undefined;
  if (dateFrom || dateTo) {
    const dateRange: Prisma.DateTimeFilter = {};
    if (dateFrom) dateRange.gte = dateFrom;
    if (dateTo) dateRange.lte = dateTo;
    dateOrConditions = [
      { FGFechaCreado: dateRange },
      { FGFechaVencimiento: dateRange },
    ];
  }

  if (search) {
    const searchTrimmed = search.trim();
    const searchLower = searchTrimmed.toLowerCase();
    const searchUpper = searchTrimmed.toUpperCase();
    const searchNumber = parseInt(searchTrimmed, 10);
    const searchDecimal = parseFloat(searchTrimmed);
    const isNumber = !isNaN(searchNumber);
    const isDecimal =
      !isNaN(searchDecimal) &&
      searchTrimmed !== "" &&
      Number.isFinite(searchDecimal);

    const orConditions: Prisma.FacturagWhereInput[] = [
      { FGPurchaseOrder: { contains: searchTrimmed, mode: "insensitive" } },
      {
        cltemae: {
          CRazonSocial: { contains: searchTrimmed, mode: "insensitive" },
        },
      },
      {
        cltemae: {
          CNombreCliente: { contains: searchTrimmed, mode: "insensitive" },
        },
      },
      {
        vendedor: { VNombre: { contains: searchTrimmed, mode: "insensitive" } },
      },
    ];

    if (isNumber) {
      orConditions.push({ FGNro: searchNumber });
    }

    const statusValues: EstadoFactura[] = [
      EstadoFactura.ACTIVE,
      EstadoFactura.PAID,
      EstadoFactura.OVERDUE,
      EstadoFactura.ANULATED,
    ];
    if (statusValues.includes(searchUpper as EstadoFactura)) {
      orConditions.push({ FGEstado: searchUpper as EstadoFactura });
    }

    if (isDecimal) {
      orConditions.push({ FGValorTotalNeto: searchDecimal });
      orConditions.push({ FGSaldo: searchDecimal });
    }

    const initialLoadKeywords = ["initial", "saldo", "carga", "load"];
    if (initialLoadKeywords.some((k) => searchLower.includes(k))) {
      orConditions.push({ FGFacturaDeSaldo: true });
    }
    const dispatchKeywords = ["dispatch", "order", "pedido"];
    if (dispatchKeywords.some((k) => searchLower.includes(k))) {
      orConditions.push({ FGFacturaDeSaldo: false });
    }

    where.OR = orConditions;
  }

  // Apply date filter: OR (issue date in range, due date in range); if search too, AND with search OR
  if (dateOrConditions) {
    if (where.OR) {
      where.AND = [{ OR: dateOrConditions }, { OR: where.OR }];
      delete where.OR;
    } else {
      where.OR = dateOrConditions;
    }
  }

  const [facturas, total] = await prisma.$transaction([
    prisma.facturag.findMany({
      where,
      skip,
      take: limit,
      orderBy: { FGFechaCreado: "desc" },
      include: {
        cltemae: true,
        vendedor: true,
        facturau: {
          include: {
            invcaruni: true,
          },
          orderBy: [{ invcaruni: { CKDescripcion: "asc" } }, { FULote: "asc" }],
        },
      },
    }),
    prisma.facturag.count({ where }),
  ]);

  return { facturas: facturas.map(mapFacturaGToApi), total };
};

/**
 * Obtiene una factura por su secuencia en la organización
 */
export const getFacturaBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  // 1. Obtener factura con todos los items
  const factura = await prisma.facturag.findFirst({
    where: {
      FGOrganizationId: organizationId,
      FGOrgSecuencia: orgSecuencia,
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
      facturau: {
        include: {
          invcaruni: {
            include: {
              grupo: true,
              unidadDeMedida: true,
            },
          },
        },
        orderBy: [{ invcaruni: { CKDescripcion: "asc" } }, { FULote: "asc" }],
      },
      movCXC: {
        include: {
          tipoMovimiento: true,
          walletPayment: { include: { bank: true } },
          creditCardPayment: { include: { bank: true } },
          transferPayment: { include: { bank: true } },
          checkPayment: { include: { bank: true } },
        },
        orderBy: [{ MCSecuencia: "asc" }],
      },
    },
  });

  if (!factura) {
    throw new EntityNotFoundError(
      "Invoice not found or is not a balance invoice",
    );
  }

  return mapFacturaGToApi(factura);
};

/**
 * Obtiene los datos para el statement de un cliente: facturas con saldo > 0 (excluye anuladas).
 * Usado para generar el PDF de statement y enviarlo por email.
 */
export const getStatementData = async (
  clienteId: number,
  organizationId: string,
) => {
  const facturas = await prisma.facturag.findMany({
    where: {
      FGOrganizationId: organizationId,
      FGClienteId: clienteId,
      FGSaldo: { gt: 0 },
      FGEstado: { not: EstadoFactura.ANULATED },
    },
    orderBy: { FGFechaCreado: "asc" },
    include: { cltemae: true },
  });

  const clientName =
    facturas[0]?.cltemae.CRazonSocial ??
    facturas[0]?.cltemae.CNombreCliente ??
    "N/A";

  const rows = facturas.map((f) => ({
    issueDate: f.FGFechaCreado,
    dueDate: f.FGFechaVencimiento,
    invoiceNumber: f.FGNro,
    amount: Number(f.FGSaldo),
    estado: f.FGEstado,
  }));

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return { rows, clientName, total };
};

/**
 * Obtiene los IDs de clientes que tienen al menos una factura con saldo pendiente
 * (estado ACTIVE u OVERDUE). Para envío de statements usar
 * {@link getClienteIdsWithOutstandingBalanceAndOverdue}.
 */
export const getClienteIdsWithOutstandingBalance = async (
  organizationId: string,
): Promise<number[]> => {
  const rows = await prisma.facturag.findMany({
    where: {
      FGOrganizationId: organizationId,
      FGSaldo: { gt: 0 },
      FGEstado: { in: [EstadoFactura.ACTIVE, EstadoFactura.OVERDUE] },
    },
    select: { FGClienteId: true },
    distinct: ["FGClienteId"],
  });
  return rows.map((r) => r.FGClienteId);
};

/** Clients with outstanding balance and at least one invoice in OVERDUE status. */
export const getClienteIdsWithOutstandingBalanceAndOverdue = async (
  organizationId: string,
): Promise<number[]> => {
  const rows = await prisma.facturag.findMany({
    where: {
      FGOrganizationId: organizationId,
      FGSaldo: { gt: 0 },
      FGEstado: EstadoFactura.OVERDUE,
    },
    select: { FGClienteId: true },
    distinct: ["FGClienteId"],
  });
  return rows.map((r) => r.FGClienteId);
};

/** @deprecated Use {@link getClienteIdsWithOutstandingBalanceAndOverdue}. */
export const getClienteIdsWithOutstandingBalanceAndPastDue =
  getClienteIdsWithOutstandingBalanceAndOverdue;

/** True when the client has balance on at least one OVERDUE invoice (statement send gate). */
export const clientHasOverdueOutstandingInvoices = async (
  clienteId: number,
  organizationId: string,
): Promise<boolean> => {
  const count = await prisma.facturag.count({
    where: {
      FGOrganizationId: organizationId,
      FGClienteId: clienteId,
      FGSaldo: { gt: 0 },
      FGEstado: EstadoFactura.OVERDUE,
    },
  });
  return count > 0;
};

/** @deprecated Use {@link clientHasOverdueOutstandingInvoices}. */
export const clientHasPastDueOutstandingInvoices =
  clientHasOverdueOutstandingInvoices;

/**
 * Obtiene el siguiente número de factura disponible
 * Basado en COBOL lines 174-180
 */
export const getSiguienteFacturaSecuencia = async (organizationId: string) => {
  const ultimoFactura = await prisma.facturag.findFirst({
    where: { FGOrganizationId: organizationId },
    orderBy: { FGOrgSecuencia: "desc" },
  });

  return (ultimoFactura?.FGOrgSecuencia ?? 0) + 1;
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
      "No outbound movement type configured for invoices was found. Please configure a movement type with purpose DISPATCH_ORDER",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento de entrada configurado para devoluciones
 * Busca por propósito DISPATCH_ORDER_DEVOLUCION primero, luego fallback a boolean flags
 */
const obtenerTipoMovimientoDispatchDevolucion = async (
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
        "Please configure a movement type with purpose DISPATCH_ORDER_DEVOLUCION.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento de entrada configurado para devoluciones
 * Busca por propósito DISPATCH_ORDER_DEVOLUCION primero, luego fallback a boolean flags
 */
const obtenerTipoMovimientoFacturaDevolucion = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  // Try to find by purpose first
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.FACTURA_DEVOLUCION,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No inbound movement type configured for returns was found. " +
        "Please configure a movement type with purpose FACTURA_DEVOLUCION.",
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

// ===== CREACIÓN Y ACTUALIZACIÓN =====

export const createFactura = async (data: CrearFacturaDto, usuario: string) => {
  const { factura, outboxEventId } = await prisma.$transaction(async (tx) => {
    // 1. Validar que el dispatch order existe
    const dispatchOrder = await tx.dispatchOrderG.findUnique({
      where: { DOGId: data.dispatchOrderId },
      include: {
        cltemae: true, // Include client for email and name
      },
    });
    if (
      !dispatchOrder ||
      dispatchOrder.DOGEstado !== EstadoDispatchOrder.DISPATCHED
    ) {
      throw new EntityNotFoundError(
        "Dispatch order not found or is not dispatched",
      );
    }

    // 2. Obtener tipos de movimiento para distinguir items originales de devoluciones
    const tipoMovimientoSalida = await obtenerTipoMovimientoFactura(
      dispatchOrder.DOGOrganizationId,
      tx,
    );
    const tipoMovimientoEntrada = await obtenerTipoMovimientoDispatchDevolucion(
      dispatchOrder.DOGOrganizationId,
      tx,
    );

    // 3. Obtener todos los items del dispatch order (originales + devoluciones)
    const dispatchOrderItems = await tx.dispatchOrderU.findMany({
      where: {
        DOUNro: dispatchOrder.DOGNro,
        DOUOrganizationId: dispatchOrder.DOGOrganizationId,
      },
      include: {
        tipoMovimiento: true,
        invcaruni: true, // Needed for CKIva to calculate VAT
      },
    });

    // 4. Separar items originales (salida) de devoluciones (entrada)
    const itemsOriginales = dispatchOrderItems.filter(
      (item) => item.tipoMovimiento.TId === tipoMovimientoSalida.TId,
    );
    const itemsDevolucion = dispatchOrderItems.filter(
      (item) => item.tipoMovimiento.TId === tipoMovimientoEntrada.TId,
    );

    // 5. Sumar devoluciones por item original (DOUId),
    // respetando DOUOriginalItemId para soportar multiples filas con mismo producto+lote+documento.
    const devolucionesPorOriginalId = sumReturnsByOriginalItemId(
      itemsOriginales
        .filter((item) => item.DOULote != null && item.DOUNroDocumento != null)
        .map((item) => ({
          DOUId: item.DOUId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
      itemsDevolucion
        .filter((item) => item.DOULote != null && item.DOUNroDocumento != null)
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

    // 6. Calcular cantidades netas y ajustar precios para cada item original
    const itemsAjustados: {
      cantidadNeta: number;
      item: (typeof itemsOriginales)[0];
      vrBrutoAjustado: number;
      vrNetoAjustado: number;
    }[] = [];

    let todosItemsDevueltos = true;

    for (const item of itemsOriginales) {
      if (!item.DOULote || !item.DOUNroDocumento) {
        // Items sin lote o documento no se pueden devolver, incluir como están
        itemsAjustados.push({
          item,
          cantidadNeta: Number(item.DOUCantidad),
          vrBrutoAjustado: Number(item.DOUVrBruto),
          vrNetoAjustado: Number(item.DOUVrNeto),
        });
        if (Number(item.DOUCantidad) > 0) {
          todosItemsDevueltos = false;
        }
        continue;
      }

      // Si no hay devoluciones para este item original, cantidadDevuelta será 0
      const cantidadDevuelta = devolucionesPorOriginalId.get(item.DOUId) ?? 0;
      const cantidadOriginal = Number(item.DOUCantidad);
      const cantidadNeta = cantidadOriginal - cantidadDevuelta;

      if (cantidadNeta > 0) {
        todosItemsDevueltos = false;
      }

      if (cantidadNeta <= 0) {
        // Item completamente devuelto, no incluir en factura
        continue;
      }

      // Calculate exact values from raw data (same pattern as totals calculation)
      // This ensures mathematical exactness and consistency with totals
      const precioUnitario = Number(item.DOUVrUnitario);
      const descuento = Number(item.DOUDescuento);
      const ivaRate = Number(item.invcaruni.CKIva);

      // Bruto = cantidadNeta × precioUnitario (adjusted quantity)
      const vrBrutoAjustado = cantidadNeta * precioUnitario;

      // Descuento = bruto × (descuento / 100)
      const itemDescuento = vrBrutoAjustado * (descuento / 100);

      // Subtotal after discount
      const subtotalAfterDiscount = vrBrutoAjustado - itemDescuento;

      // IVA = subtotalAfterDiscount × (ivaRate / 100) if tieneImpuesto
      let valorIvaAjustado = 0;
      if (item.DOUTieneImpuesto && ivaRate > 0) {
        valorIvaAjustado = subtotalAfterDiscount * (ivaRate / 100);
      }

      // Neto = (bruto - descuento) + IVA
      const vrNetoAjustado = subtotalAfterDiscount + valorIvaAjustado;

      itemsAjustados.push({
        item,
        cantidadNeta,
        vrBrutoAjustado: vrBrutoAjustado,
        vrNetoAjustado: vrNetoAjustado,
      });
    }

    // 7. Determinar estado de la factura
    const estadoFactura = todosItemsDevueltos
      ? EstadoFactura.ANULATED
      : EstadoFactura.ACTIVE;

    // 8. Calcular totales de la factura desde items ajustados (usando cantidadNeta)
    // Calculate all totals from raw data for accuracy and consistency
    let valorTotalBruto = 0;
    let totalDescuento = 0;
    let totalIVA = 0;

    for (const { item, cantidadNeta } of itemsAjustados) {
      const precioUnitario = Number(item.DOUVrUnitario);
      const descuento = Number(item.DOUDescuento);
      const ivaRate = Number(item.invcaruni.CKIva);

      // Bruto = cantidadNeta × precioUnitario (adjusted quantity)
      const itemBruto = cantidadNeta * precioUnitario;
      valorTotalBruto += itemBruto;

      // Descuento = bruto × (descuento / 100)
      const itemDescuento = itemBruto * (descuento / 100);
      totalDescuento += itemDescuento;

      // IVA = (bruto - descuento) × (ivaRate / 100) if tieneImpuesto
      if (item.DOUTieneImpuesto && ivaRate > 0) {
        const subtotalAfterDiscount = itemBruto - itemDescuento;
        const itemIVA = subtotalAfterDiscount * (ivaRate / 100);
        totalIVA += itemIVA;
      }
    }

    // Neto = (bruto - descuento) + IVA
    const valorTotalNeto = valorTotalBruto - totalDescuento + totalIVA;

    // 9. Calcular fecha de vencimiento
    // diasParaVencimiento es obligatorio según el validador
    const diasParaVencimiento = Number(data.diasParaVencimiento);

    // Calcular fecha de vencimiento: fecha de creación + días (usando milisegundos para precisión)
    const fechaCreado = new Date();
    const fechaVencimiento = new Date(fechaCreado);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasParaVencimiento);

    // 10. Crear factura header
    const siguienteSecuencial = await getSiguienteFacturaSecuencia(
      dispatchOrder.DOGOrganizationId,
    );

    const factura = await tx.facturag.create({
      data: {
        FGOrganizationId: dispatchOrder.DOGOrganizationId,
        FGNro: dispatchOrder.DOGNro,
        FGOrgSecuencia: siguienteSecuencial,
        FGClienteId: dispatchOrder.DOGClienteId,
        FGVendedorId: dispatchOrder.DOGVendedorId,
        FGPurchaseOrder: dispatchOrder.DOGPurchaseOrder ?? null,
        FGPago: data.pago,
        FGValorTotalNeto: valorTotalNeto,
        FGValorTotalBruto: valorTotalBruto,
        FGTotalDescuento: totalDescuento,
        FGTotalIVA: totalIVA,
        FGSaldo: valorTotalNeto,
        FGEstado: estadoFactura,
        FGFacturaDeSaldo: false,
        FGFechaCreado: fechaCreado,
        FGFechaVencimiento: fechaVencimiento,
        FGTelefono1: dispatchOrder.DOGTelefono1,
        FGTelefono2: dispatchOrder.DOGTelefono2 ?? null,
        FGCorreo1: dispatchOrder.DOGCorreo1,
        FGCorreo2: dispatchOrder.DOGCorreo2 ?? null,
        FGDireccionEntrega: dispatchOrder.DOGDireccionEntrega,
        FGCiudadId: dispatchOrder.DOGCiudadId,
        FGCondicion1: dispatchOrder.DOGCondicion1 ?? null,
        FGCondicion2: dispatchOrder.DOGCondicion2 ?? null,
        FGCondicion3: dispatchOrder.DOGCondicion3 ?? null,
        usuario,
      },
    });

    // 11. Crear items de factura solo para items con cantidad neta > 0
    const facturaItems = itemsAjustados.map(
      ({ item, cantidadNeta, vrBrutoAjustado, vrNetoAjustado }) => ({
        FUOrganizationId: dispatchOrder.DOGOrganizationId,
        FUFacturaId: factura.FGId,
        FUInvcaruniId: item.DOUInvcaruniId,
        FUNro: item.DOUNro,
        FUCantidad: cantidadNeta,
        FUVrUnitario: item.DOUVrUnitario,
        FUDescuento: item.DOUDescuento,
        FUVrNeto: vrNetoAjustado,
        FUVrBruto: vrBrutoAjustado,
        FUDetalle: item.DOUDetalle,
        FUTieneImpuesto: item.DOUTieneImpuesto,
        FULote: item.DOULote,
        FULoteNroDocumento: item.DOUNroDocumento,
        FUCostoPromedio: item.DOUCostoPromedio,
        usuario,
      }),
    );

    // 12. Crear items de factura
    if (facturaItems.length > 0) {
      await tx.facturau.createMany({
        data: facturaItems,
      });
    }

    // 13. Actualizar dispatch order a estado INVOICED
    await tx.dispatchOrderG.update({
      where: {
        DOGOrganizationId_DOGOrgSecuencia: {
          DOGOrganizationId: dispatchOrder.DOGOrganizationId,
          DOGOrgSecuencia: dispatchOrder.DOGOrgSecuencia,
        },
      },
      data: {
        DOGEstado: EstadoDispatchOrder.INVOICED,
        DOGFechaFacturacion: new Date(),
      },
    });

    // 14. Create outbox event for async processing (PDF, S3, Email)
    const outboxEvent = await tx.outboxEvent.create({
      data: {
        organizationId: dispatchOrder.DOGOrganizationId,
        eventType: "INVOICE_CREATED",
        aggregateType: "FACTURA",
        aggregateId: factura.FGId,
        payload: {
          secuencia: factura.FGOrgSecuencia,
          clienteEmail: dispatchOrder.DOGCorreo1,
          clienteEmail2: dispatchOrder.DOGCorreo2,
          nro: factura.FGNro,
          clienteNombre:
            dispatchOrder.cltemae.CRazonSocial ||
            dispatchOrder.cltemae.CNombreCliente,
          usuario,
        },
        status: "PENDING",
        maxAttempts: 3,
      },
    });

    return { factura, outboxEventId: outboxEvent.id };
  });

  // Fire-and-forget - the cron is the fallback if Redis is unavailable.
  outboxProcessQueue
    .add("process-invoice-created", { eventId: outboxEventId })
    .catch((err) => {
      console.error(
        "[queue] Failed to enqueue INVOICE_CREATED outbox event, cron will retry:",
        err,
      );
    });

  return mapFacturaGToApi(factura);
};

/**
 * Obtiene los movimientos de salida (Movkar) para una factura
 * Nota: Esta función se mantiene para uso futuro
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
 * Nota: Esta función se mantiene para uso futuro
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

    // 2. Validar que esté en estado DISPATCHED
    if (dispatchOrder.DOGEstado !== EstadoDispatchOrder.DISPATCHED) {
      throw new EntityValidationError(
        "Returns can only be created for DISPATCHED dispatch orders",
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
      orderBy: [{ invcaruni: { CKDescripcion: "asc" } }, { DOULote: "asc" }],
    });

    // 5. Obtener tipo de movimiento de entrada para devoluciones
    const tipoMovimientoEntrada = await obtenerTipoMovimientoFacturaDevolucion(
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

    // 7. Sumar devoluciones por item original de dispatch (DOUId)
    const devolucionesPorOriginalId = sumReturnsByOriginalItemId(
      itemsOriginales
        .filter((item) => item.DOULote != null && item.DOUNroDocumento != null)
        .map((item) => ({
          DOUId: item.DOUId,
          DOUInvcaruniId: item.DOUInvcaruniId,
          DOULote: item.DOULote,
          DOUNroDocumento: item.DOUNroDocumento,
          DOUCantidad: Number(item.DOUCantidad),
        })),
      itemsDevolucion
        .filter((item) => item.DOULote != null && item.DOUNroDocumento != null)
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
          devolucionesPorOriginalId.get(item.DOUId) ?? 0;
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
            grupo: item.invcaruni.grupo,
            unidadDeMedida: item.invcaruni.unidadDeMedida,
          },
          lote: item.DOULote,
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

// ===== FUNCIONES AUXILIARES PARA MOVCXC =====

/**
 * Obtiene el tipo de movimiento configurado para pagos (ABONO)
 */
const obtenerTipoMovimientoAbono = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.ABONO,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No movement type configured for payments (ABONO) was found. Please configure a movement type with purpose ABONO.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento configurado para notas débito (NOTA_DEBITO)
 */
const obtenerTipoMovimientoNotaDebito = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.NOTA_DEBITO,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No movement type configured for debit notes (NOTA_DEBITO) was found. Please configure a movement type with purpose NOTA_DEBITO.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento configurado para notas crédito simples (NOTA_CREDITO)
 */
const obtenerTipoMovimientoNotaCredito = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.NOTA_CREDITO,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No movement type configured for credit notes (NOTA_CREDITO) was found. Please configure a movement type with purpose NOTA_CREDITO.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el tipo de movimiento configurado para notas crédito con devolución (NOTA_CREDITO_CON_DEVOLUCION)
 */
const obtenerTipoMovimientoNotaCreditoConDevolucion = async (
  organizationId: string,
  tx: Prisma.TransactionClient,
) => {
  const tipoMovimiento = await tx.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.NOTA_CREDITO_CON_DEVOLUCION,
    },
  });

  if (!tipoMovimiento) {
    throw new EntityValidationError(
      "No movement type configured for credit notes with returns (NOTA_CREDITO_CON_DEVOLUCION) was found. Please configure a movement type with purpose NOTA_CREDITO_CON_DEVOLUCION.",
    );
  }

  return tipoMovimiento;
};

/**
 * Obtiene el siguiente número de movimiento CXC para la organización
 */
const obtenerSiguienteNumeroMovCXC = async (
  organizationId: string,
  facturaId: number,
  tx: Prisma.TransactionClient,
): Promise<number> => {
  const ultimoMovimiento = await tx.movCXC.findFirst({
    where: { MCOrganizationId: organizationId, MCFacturaId: facturaId },
    orderBy: { MCSecuencia: "desc" },
  });

  return (ultimoMovimiento?.MCSecuencia ?? 0) + 1;
};

/**
 * Calcula el balance actual de una factura
 * Balance = valorTotalNeto - sum(pagos) + sum(notasDebito)
 */
const calcularBalanceFactura = async (
  facturaId: number,
  organizationId: string,
  tx: Prisma.TransactionClient,
): Promise<number> => {
  const factura = await tx.facturag.findUnique({
    where: { FGId: facturaId },
    select: { FGValorTotalNeto: true },
  });

  if (!factura) {
    throw new EntityNotFoundError("Invoice not found");
  }

  // Obtener tipo de movimiento para pagos
  const tipoAbono = await obtenerTipoMovimientoAbono(organizationId, tx);
  const tipoNotaDebito = await obtenerTipoMovimientoNotaDebito(
    organizationId,
    tx,
  );

  // Sumar todos los pagos (ABONO)
  const pagos = await tx.movCXC.findMany({
    where: {
      MCFacturaId: facturaId,
      MCTipoMovimientoId: tipoAbono.TId,
    },
    select: { MCValor: true },
  });

  const totalPagos = pagos.reduce((sum, pago) => sum + Number(pago.MCValor), 0);

  // Sumar todas las notas débito (NOTA_DEBITO)
  const notasDebito = await tx.movCXC.findMany({
    where: {
      MCFacturaId: facturaId,
      MCTipoMovimientoId: tipoNotaDebito.TId,
    },
    select: { MCValor: true },
  });

  const totalNotasDebito = notasDebito.reduce(
    (sum, nota) => sum + Number(nota.MCValor),
    0,
  );

  // Balance = total - pagos + notas débito
  return Number(factura.FGValorTotalNeto) - totalPagos + totalNotasDebito;
};

// ===== SERVICIOS DE MOVCXC =====

/**
 * Registra un pago para una factura
 * Si el pago cubre o excede el balance, marca la factura como PAID
 */
export const registrarPago = async (
  FGId: number,
  data: RegistrarPagoDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la factura existe
    const factura = await tx.facturag.findUnique({
      where: {
        FGId: FGId,
      },
    });

    if (factura?.FGOrganizationId !== organizationId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // 2. Validar que la factura no está pagada
    if (factura.FGEstado === EstadoFactura.PAID) {
      throw new EntityValidationError(
        "Payments cannot be registered for invoices with status PAID. The invoice has already been fully paid.",
      );
    }

    // 3. Validar que la factura está en un estado válido para recibir pagos
    if (
      factura.FGEstado !== EstadoFactura.ACTIVE &&
      factura.FGEstado !== EstadoFactura.OVERDUE
    ) {
      throw new EntityValidationError(
        `Payments can only be registered for invoices with status ACTIVE or OVERDUE. Current status: ${factura.FGEstado}`,
      );
    }

    if (data.MCFecha < factura.FGFechaCreado) {
      throw new EntityValidationError(
        `Payment date cannot be before the invoice issue date. Current date: ${data.MCFecha}`,
      );
    }

    // 4. Obtener tipo de movimiento para pagos
    const tipoMovimiento = await obtenerTipoMovimientoAbono(organizationId, tx);

    // 5. Calcular balance actual antes del pago
    const balanceActual = Number(factura.FGSaldo);

    // 6. Obtener siguiente número de movimiento
    const siguienteNumero = await obtenerSiguienteNumeroMovCXC(
      organizationId,
      factura.FGId,
      tx,
    );

    // 6. Crear registro de pago
    const movimientoPago = await tx.movCXC.create({
      data: {
        MCOrganizationId: organizationId,
        MCFacturaId: factura.FGId,
        MCTipoMovimientoId: tipoMovimiento.TId,
        MCNro: factura.FGNro,
        MCNroDocumento: data.MCNroDocumento,
        MCDescripcion: data.MCDescripcion,
        MCValor: data.MCValor,
        MCTipoPago: data.MCTipoPago,
        MCFecha: data.MCFecha,
        MCSecuencia: siguienteNumero,
        usuario,
      },
    });

    // 7. Create payment details based on type
    if (data.MCTipoPago === "WALLET" && data.walletDetails) {
      await tx.walletPayment.create({
        data: {
          WPMovCXCId: movimientoPago.MCId,
          WPOrganizationId: organizationId,
          WPBancoId: data.walletDetails.WPBancoId,
          WPNombreWallet: data.walletDetails.WPNombreWallet,
          WPTelefonoOClave: data.walletDetails.WPTelefonoOClave,
          usuario,
        },
      });
    } else if (data.MCTipoPago === "CREDIT_CARD" && data.creditCardDetails) {
      await tx.creditCardPayment.create({
        data: {
          CCPMovCXCId: movimientoPago.MCId,
          CCPOrganizationId: organizationId,
          CCPBancoId: data.creditCardDetails.CCPBancoId,
          CCPMarca: data.creditCardDetails.CCPMarca,
          CCPUltimos4Digitos: data.creditCardDetails.CCPUltimos4Digitos,
          usuario,
        },
      });
    } else if (data.MCTipoPago === "TRANSFER" && data.transferDetails) {
      await tx.transferPayment.create({
        data: {
          TPMovCXCId: movimientoPago.MCId,
          TPOrganizationId: organizationId,
          TPBancoId: data.transferDetails.TPBancoId,
          TPTipoCuenta: data.transferDetails.TPTipoCuenta,
          TPNumeroCuenta: data.transferDetails.TPNumeroCuenta,
          usuario,
        },
      });
    } else if (data.MCTipoPago === "CHECK" && data.checkDetails) {
      await tx.checkPayment.create({
        data: {
          CHPMovCXCId: movimientoPago.MCId,
          CHPOrganizationId: organizationId,
          CHPBancoId: data.checkDetails.CHPBancoId,
          CHPNumeroCheque: data.checkDetails.CHPNumeroCheque,
          CHPFechaCheque: data.checkDetails.CHPFechaCheque,
          usuario,
        },
      });
    }

    // 8. Calcular nuevo balance después del pago
    const nuevoBalance = balanceActual - Number(data.MCValor);

    // Si es factura de slado actualizar el item
    if (factura.FGFacturaDeSaldo) {
      // Primero buscar el item de factura
      const facturaItem = await tx.facturau.findFirst({
        where: {
          FUFacturaId: factura.FGId,
          FUOrganizationId: organizationId,
        },
      });

      if (facturaItem) {
        await tx.facturau.update({
          where: { FUId: facturaItem.FUId }, // Usar FUId que sí es único
          data: {
            FUVrNeto: nuevoBalance,
            FUVrBruto: nuevoBalance,
            FUVrUnitario: nuevoBalance,
          },
        });
      }
    }

    // 10. Si el pago cubre o excede el balance, marcar factura como PAID
    const facturaActualizada = await tx.facturag.update({
      where: { FGId: factura.FGId },
      data: {
        ...(nuevoBalance <= 0 && {
          FGEstado: EstadoFactura.PAID,
          FGFechaPago: new Date(),
        }),
        FGSaldo: nuevoBalance,
      },
      include: {
        cltemae: true,
        vendedor: true,
      },
    });

    return mapFacturaGToApi(facturaActualizada);
  });
};

/**
 * Registra una nota débito para una factura
 * Si la factura estaba PAID, la revierte a ACTIVE
 */
export const registrarNotaDebito = async (
  FGId: number,
  data: RegistrarNotaDebitoDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la factura existe
    const factura = await tx.facturag.findUnique({
      where: { FGId: FGId },
    });

    if (factura?.FGOrganizationId !== organizationId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // 2. Validar que la factura no está pagada
    if (factura.FGEstado === EstadoFactura.PAID) {
      throw new EntityValidationError(
        "Debit notes cannot be registered for invoices with status PAID. The invoice has already been fully paid.",
      );
    }

    // 3. Validar que la factura está en un estado válido para recibir notas débito
    if (
      factura.FGEstado !== EstadoFactura.ACTIVE &&
      factura.FGEstado !== EstadoFactura.OVERDUE
    ) {
      throw new EntityValidationError(
        `Debit notes can only be registered for invoices with status ACTIVE or OVERDUE. Current status: ${factura.FGEstado}`,
      );
    }

    // 3.1 Validar que la fecha del movimiento no sea anterior a la fecha de creación de la factura
    if (data.MCFecha < factura.FGFechaCreado) {
      throw new EntityValidationError(
        `Movement date cannot be before the invoice issue date.`,
      );
    }

    // 4. Obtener tipo de movimiento para notas débito
    const tipoMovimiento = await obtenerTipoMovimientoNotaDebito(
      organizationId,
      tx,
    );

    // 5. Obtener siguiente número de movimiento
    const siguienteNumero = await obtenerSiguienteNumeroMovCXC(
      organizationId,
      factura.FGId,
      tx,
    );

    // 6. Crear registro de nota débito
    const movimientoNotaDebito = await tx.movCXC.create({
      data: {
        MCOrganizationId: organizationId,
        MCFacturaId: factura.FGId,
        MCTipoMovimientoId: tipoMovimiento.TId,
        MCNro: factura.FGNro,
        MCNroDocumento: data.MCNroDocumento,
        MCDescripcion: data.MCDescripcion,
        MCValor: data.MCValor,
        MCTipoPago: factura.FGPago, // Usar el tipo de pago de la factura
        MCFecha: data.MCFecha,
        MCSecuencia: siguienteNumero,
        usuario,
      },
    });

    // 7. Calcular nuevo balance después de la nota débito
    const balanceNuevo = Number(factura.FGSaldo) + Number(data.MCValor);

    // Si es factura de slado actualizar el item
    if (factura.FGFacturaDeSaldo) {
      // Primero buscar el item de factura
      const facturaItem = await tx.facturau.findFirst({
        where: {
          FUFacturaId: factura.FGId,
          FUOrganizationId: organizationId,
        },
      });

      if (facturaItem) {
        await tx.facturau.update({
          where: { FUId: facturaItem.FUId }, // Usar FUId que sí es único
          data: {
            FUVrNeto: balanceNuevo,
            FUVrBruto: balanceNuevo,
            FUVrUnitario: balanceNuevo,
          },
        });
      }
    }

    // 8. Obtener factura actualizada
    const facturaActualizada = await tx.facturag.update({
      where: { FGId: factura.FGId },
      data: {
        FGSaldo: balanceNuevo,
      },
      include: {
        cltemae: true,
        vendedor: true,
      },
    });

    return mapFacturaGToApi(facturaActualizada);
  });
};

/**
 * Registra una nota crédito simple para una factura (sin devolución de inventario)
 * Solo afecta el balance financiero
 */
export const registrarNotaCredito = async (
  FGId: number,
  data: RegistrarNotaCreditoDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la factura existe
    const factura = await tx.facturag.findUnique({
      where: { FGId: FGId },
    });

    if (factura?.FGOrganizationId !== organizationId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // 2. Validar que la factura no está pagada
    if (factura.FGEstado === EstadoFactura.PAID) {
      throw new EntityValidationError(
        "Credit notes cannot be registered for invoices with status PAID. The invoice has already been fully paid.",
      );
    }

    // 3. Validar que la factura está en un estado válido para recibir notas crédito
    if (
      factura.FGEstado !== EstadoFactura.ACTIVE &&
      factura.FGEstado !== EstadoFactura.OVERDUE
    ) {
      throw new EntityValidationError(
        `Credit notes can only be registered for invoices with status ACTIVE or OVERDUE. Current status: ${factura.FGEstado}`,
      );
    }

    // 3.1 Validar que la fecha del movimiento no sea anterior a la fecha de creación de la factura
    if (data.MCFecha < factura.FGFechaCreado) {
      throw new EntityValidationError(
        `Movement date cannot be before the invoice issue date.`,
      );
    }

    // 4. Obtener tipo de movimiento para notas crédito
    const tipoMovimiento = await obtenerTipoMovimientoNotaCredito(
      organizationId,
      tx,
    );

    // 5. Obtener siguiente número de movimiento
    const siguienteNumero = await obtenerSiguienteNumeroMovCXC(
      organizationId,
      factura.FGId,
      tx,
    );

    // 5. Crear registro de nota crédito
    const movimientoNotaCredito = await tx.movCXC.create({
      data: {
        MCOrganizationId: organizationId,
        MCFacturaId: factura.FGId,
        MCTipoMovimientoId: tipoMovimiento.TId,
        MCNro: factura.FGNro,
        MCNroDocumento: data.MCNroDocumento,
        MCDescripcion: data.MCDescripcion,
        MCValor: data.MCValor,
        MCTipoPago: factura.FGPago,
        MCFecha: data.MCFecha,
        MCSecuencia: siguienteNumero,
        usuario,
      },
    });

    // 7. Calcular nuevo balance (subtract credit note value)
    const nuevoBalance = Number(factura.FGSaldo) - Number(data.MCValor);

    // Si es factura de saldo actualizar el item
    if (factura.FGFacturaDeSaldo) {
      // Primero buscar el item de factura
      const facturaItem = await tx.facturau.findFirst({
        where: {
          FUFacturaId: factura.FGId,
          FUOrganizationId: organizationId,
        },
      });

      if (facturaItem) {
        await tx.facturau.update({
          where: { FUId: facturaItem.FUId },
          data: {
            FUVrNeto: nuevoBalance,
            FUVrBruto: nuevoBalance,
            FUVrUnitario: nuevoBalance,
          },
        });
      }
    }

    // 8. Actualizar balance (no modificar totales)
    const facturaActualizada = await tx.facturag.update({
      where: { FGId: factura.FGId },
      data: { FGSaldo: nuevoBalance },
      include: {
        cltemae: true,
        vendedor: true,
      },
    });

    return mapFacturaGToApi(facturaActualizada);
  });
};

/**
 * Obtiene los items de una factura que están disponibles para devolución
 * Calcula: cantidad disponible = cantidad original - cantidad ya devuelta
 */
export const obtenerItemsFacturaParaDevolucion = async (
  FGId: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const factura = await tx.facturag.findUnique({
      where: { FGId },
      include: {
        facturau: {
          where: { FUCantidad: { gt: 0 } }, // Solo items positivos (originales)
          include: {
            invcaruni: {
              include: {
                grupo: true,
                unidadDeMedida: true,
              },
            },
          },
        },
      },
    });

    if (factura?.FGOrganizationId !== organizationId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // Obtener todos los items de devolución para esta factura (negativos)
    const returnItems = await tx.facturau.findMany({
      where: {
        FUFacturaId: FGId,
        FUCantidad: { lt: 0 }, // Negativos = devoluciones
      },
    });

    // Calcular cantidades ya devueltas por item original de factura (FUId)
    const returnedByOriginalId = sumFacturaReturnsByOriginalItemId(
      factura.facturau
        .filter(
          (item) => item.FULote != null && item.FULoteNroDocumento != null,
        )
        .map((item) => ({
          FUId: item.FUId,
          FUInvcaruniId: item.FUInvcaruniId,
          FULote: item.FULote,
          FULoteNroDocumento: item.FULoteNroDocumento,
          FUCantidad: Number(item.FUCantidad),
        })),
      returnItems
        .filter(
          (item) => item.FULote != null && item.FULoteNroDocumento != null,
        )
        .map((item) => ({
          FUOriginalItemId:
            (item as { FUOriginalItemId?: null | number }).FUOriginalItemId ??
            null,
          FUInvcaruniId: item.FUInvcaruniId,
          FULote: item.FULote,
          FULoteNroDocumento: item.FULoteNroDocumento,
          FUCantidad: Math.abs(Number(item.FUCantidad)),
        })),
    );

    // Construir lista de items disponibles
    const itemsDisponibles = factura.facturau
      .map((item) => {
        if (!item.FULote) {
          return null; // Items sin lote no se pueden devolver
        }

        const cantidadOriginal = Number(item.FUCantidad);
        const cantidadDevuelta = returnedByOriginalId.get(item.FUId) ?? 0;
        const cantidadDisponible = cantidadOriginal - cantidadDevuelta;

        if (cantidadDisponible <= 0) {
          return null;
        }

        return {
          FUId: item.FUId,
          producto: {
            CKId: item.invcaruni.CKId,
            CKDescripcion: item.invcaruni.CKDescripcion,
            grupo: item.invcaruni.grupo,
            unidadDeMedida: item.invcaruni.unidadDeMedida,
          },
          lote: item.FULote,
          cantidadOriginal: item.FUCantidad,
          cantidadYaDevuelta: cantidadDevuelta,
          cantidadDisponible,
          precioUnitario: item.FUVrUnitario,
          tieneImpuesto: item.FUTieneImpuesto,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return itemsDisponibles;
  });
};

/**
 * Registra una nota crédito con devolución de inventario para una factura
 * Crea MovCXC, Facturau negativos y movimientos de inventario de entrada
 */
export const registrarNotaCreditoConDevolucion = async (
  FGId: number,
  data: RegistrarNotaCreditoConDevolucionDto,
  organizationId: string,
  usuario: string,
) => {
  const targetPeriod = periodFromDate(data.MCFecha);
  await assertPriorPeriodsClosed(organizationId, targetPeriod);

  return prisma.$transaction(async (tx) => {
    // 1. Validar factura
    const factura = await tx.facturag.findUnique({
      where: { FGId },
      include: {
        facturau: {
          include: {
            invcaruni: true,
          },
        },
      },
    });

    if (factura?.FGOrganizationId !== organizationId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // 2. Validar que la factura no está pagada
    if (factura.FGEstado === EstadoFactura.PAID) {
      throw new EntityValidationError(
        "Credit notes with returns cannot be registered for invoices with status PAID. The invoice has already been fully paid.",
      );
    }

    // 3. Validar estado
    if (
      factura.FGEstado !== EstadoFactura.ACTIVE &&
      factura.FGEstado !== EstadoFactura.OVERDUE
    ) {
      throw new EntityValidationError(
        `Credit notes with returns can only be registered for invoices with status ACTIVE or OVERDUE. Current status: ${factura.FGEstado}`,
      );
    }

    // 3.1 Validar que la fecha del movimiento no sea anterior a la fecha de creación de la factura
    if (data.MCFecha < factura.FGFechaCreado) {
      throw new EntityValidationError(
        `Movement date cannot be before the invoice issue date.`,
      );
    }

    // 4. Obtener tipos de movimiento y almacén
    const tipoMovimientoCredito =
      await obtenerTipoMovimientoNotaCreditoConDevolucion(organizationId, tx);
    const tipoMovimientoDevolucion =
      await obtenerTipoMovimientoFacturaDevolucion(organizationId, tx);
    const almacen = await obtenerAlmacenParaFactura(organizationId, tx);

    // 4. Validar items a devolver
    const itemsADevolver = data.items;
    const itemsMap = new Map(
      factura.facturau
        .filter((item) => Number(item.FUCantidad) > 0)
        .map((item) => [item.FUId, item]),
    );

    // Obtener items ya devueltos para calcular disponibilidad
    const returnItems = await tx.facturau.findMany({
      where: {
        FUFacturaId: FGId,
        FUMovCXCId: { not: null },
      },
    });

    const returnedByOriginalId = sumFacturaReturnsByOriginalItemId(
      factura.facturau
        .filter((item) => Number(item.FUCantidad) > 0)
        .filter(
          (item) => item.FULote != null && item.FULoteNroDocumento != null,
        )
        .map((item) => ({
          FUId: item.FUId,
          FUInvcaruniId: item.FUInvcaruniId,
          FULote: item.FULote,
          FULoteNroDocumento: item.FULoteNroDocumento,
          FUCantidad: Number(item.FUCantidad),
        })),
      returnItems
        .filter(
          (item) => item.FULote != null && item.FULoteNroDocumento != null,
        )
        .map((item) => ({
          FUOriginalItemId:
            (item as { FUOriginalItemId?: null | number }).FUOriginalItemId ??
            null,
          FUInvcaruniId: item.FUInvcaruniId,
          FULote: item.FULote,
          FULoteNroDocumento: item.FULoteNroDocumento,
          FUCantidad: Math.abs(Number(item.FUCantidad)),
        })),
    );

    let totalCreditoCalculado = 0;
    const facturaItemsACrear: {
      FUCantidad: number;
      FUCostoPromedio: (typeof factura.facturau)[0]["FUCostoPromedio"];
      FUDescuento: number;
      FUDetalle: string;
      FUFacturaId: number;
      FUInvcaruniId: number;
      FULote: string;
      FULoteNroDocumento: string;
      FUNro: number;
      FUOrganizationId: string;
      FUOriginalItemId: number;
      FUTieneImpuesto: boolean;
      FUVrBruto: number;
      FUVrNeto: number;
      FUVrUnitario: number;
      usuario: string;
    }[] = [];
    const movimientosACrear: {
      cantidad: number;
      itemOriginal: (typeof factura.facturau)[0];
      lote: string;
      loteNroDocumento: string;
    }[] = [];

    for (const itemDevolucion of itemsADevolver) {
      const itemOriginal = itemsMap.get(itemDevolucion.FUId);

      if (!itemOriginal) {
        throw new EntityNotFoundError(
          `Item ${itemDevolucion.FUId} not found in invoice`,
        );
      }

      // Validar cantidad disponible
      if (itemOriginal.FULote) {
        const cantidadYaDevuelta =
          returnedByOriginalId.get(itemOriginal.FUId) ?? 0;
        const cantidadOriginal = Number(itemOriginal.FUCantidad);
        const cantidadDisponible = cantidadOriginal - cantidadYaDevuelta;

        if (itemDevolucion.cantidad > cantidadDisponible) {
          throw new EntityValidationError(
            `Return quantity (${itemDevolucion.cantidad}) exceeds available quantity (${cantidadDisponible}) for product ${itemOriginal.invcaruni.CKDescripcion}, lot ${itemOriginal.FULote}`,
          );
        }
      }

      // Validar cantidad contra original
      if (itemDevolucion.cantidad > Number(itemOriginal.FUCantidad)) {
        throw new EntityValidationError(
          `Return quantity exceeds invoiced quantity for ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      // Calcular valores (usando misma lógica que item original)
      const precioUnitario = Number(itemOriginal.FUVrUnitario);
      const descuento = Number(itemOriginal.FUDescuento);
      const ivaRate = Number(itemOriginal.invcaruni.CKIva);

      const vrBruto = itemDevolucion.cantidad * precioUnitario;
      const descuentoValor = vrBruto * (descuento / 100);
      const subtotal = vrBruto - descuentoValor;
      const ivaValor = itemOriginal.FUTieneImpuesto
        ? subtotal * (ivaRate / 100)
        : 0;
      const vrNeto = subtotal + ivaValor;

      totalCreditoCalculado += vrNeto;

      // Preparar entrada Facturau negativa
      facturaItemsACrear.push({
        FUOrganizationId: organizationId,
        FUFacturaId: factura.FGId,
        FUInvcaruniId: itemOriginal.FUInvcaruniId,
        FUNro: factura.FGNro,
        FUCantidad: -itemDevolucion.cantidad, // NEGATIVO
        FUVrUnitario: precioUnitario,
        FUDescuento: descuento,
        FUVrBruto: -vrBruto, // NEGATIVO
        FUVrNeto: -vrNeto, // NEGATIVO
        FUDetalle: `Credit note return - ${data.MCDescripcion}`,
        FUTieneImpuesto: itemOriginal.FUTieneImpuesto,
        FULote: itemOriginal.FULote,
        FULoteNroDocumento: itemOriginal.FULoteNroDocumento,
        FUOriginalItemId: itemOriginal.FUId,
        FUCostoPromedio: itemOriginal.FUCostoPromedio,
        usuario,
      });

      // Preparar movimiento de inventario
      movimientosACrear.push({
        itemOriginal,
        cantidad: itemDevolucion.cantidad,
        lote: itemOriginal.FULote,
        loteNroDocumento: itemOriginal.FULoteNroDocumento,
      });
    }

    // 5. Crear MovCXC
    const siguienteNumero = await obtenerSiguienteNumeroMovCXC(
      organizationId,
      factura.FGId,
      tx,
    );

    const movimientoNotaCredito = await tx.movCXC.create({
      data: {
        MCOrganizationId: organizationId,
        MCFacturaId: factura.FGId,
        MCTipoMovimientoId: tipoMovimientoCredito.TId,
        MCNro: factura.FGNro,
        MCNroDocumento: data.MCNroDocumento,
        MCDescripcion: data.MCDescripcion,
        MCValor: totalCreditoCalculado,
        MCTipoPago: factura.FGPago,
        MCFecha: data.MCFecha,
        MCSecuencia: siguienteNumero,
        usuario,
      },
    });

    // 6. Crear Facturau negativos (link a MovCXC)
    for (const item of facturaItemsACrear) {
      await tx.facturau.create({
        data: { ...item, FUMovCXCId: movimientoNotaCredito.MCId },
      });
    }

    // 7. Crear movimientos de inventario de ENTRADA
    const fechaDevolucion = data.MCFecha;
    for (const movimiento of movimientosACrear) {
      const { itemOriginal, cantidad, lote, loteNroDocumento } = movimiento;

      // Validar kardex y lote
      const kardex = await tx.kardex.findFirst({
        where: {
          KOrganizationId: organizationId,
          KInvcaruniId: itemOriginal.FUInvcaruniId,
          KAlmacenId: almacen.ALId,
        },
      });

      if (!kardex) {
        throw new EntityValidationError(
          `No kardex found for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      const kardexLote = await tx.kardexLote.findFirst({
        where: {
          KLKardexId: kardex.KId,
          KLLote: lote,
          KLNroDocumento: loteNroDocumento,
          KLOrganizationId: organizationId,
        },
      });

      if (!kardexLote) {
        throw new EntityValidationError(
          `Lot ${lote} not found for product ${itemOriginal.invcaruni.CKDescripcion}`,
        );
      }

      // Calcular MVImpuesto
      const mvImpuesto = itemOriginal.FUTieneImpuesto
        ? Number(itemOriginal.invcaruni.CKIva)
        : 0;

      // Obtener costo promedio
      const costoPromedio = await obtenerCostoPromedioProducto(
        organizationId,
        itemOriginal.FUInvcaruniId,
        almacen.ALId,
        tx,
      );

      // Crear movimiento de ENTRADA
      await crearMovimientoConTx(
        tx,
        {
          MVTipoMovimientoId: tipoMovimientoDevolucion.TId,
          MVCantidad: cantidad,
          MVClienteId: factura.FGClienteId,
          MVProveedorId: null,
          MVNroDocumento: factura.FGNro.toString(),
          MVFecha: fechaDevolucion,
          MVCostoPrecio: Number(itemOriginal.FUVrUnitario),
          MVCostoSalida: costoPromedio.costoPromedio,
          MVDescuento: Number(itemOriginal.FUDescuento),
          MVImpuesto: mvImpuesto,
          MVEsCostoTemporalCero: false,
          MVLote: lote,
          MVLoteNroDocumento: loteNroDocumento,
          invcaruniId: itemOriginal.FUInvcaruniId,
          almacenId: almacen.ALId,
          organizationId: organizationId,
          ciudadId: factura.FGCiudadId,
        },
        usuario,
        true, // Activar opción de devolución
        targetPeriod,
      );
    }

    // 8. Actualizar balance
    const nuevoBalance = Number(factura.FGSaldo) - totalCreditoCalculado;

    // Si es factura de saldo actualizar el item
    if (factura.FGFacturaDeSaldo) {
      const facturaItem = await tx.facturau.findFirst({
        where: {
          FUFacturaId: factura.FGId,
          FUOrganizationId: organizationId,
          FUCantidad: { gt: 0 }, // Solo el item original
        },
      });

      if (facturaItem) {
        await tx.facturau.update({
          where: { FUId: facturaItem.FUId },
          data: {
            FUVrNeto: nuevoBalance,
            FUVrBruto: nuevoBalance,
            FUVrUnitario: nuevoBalance,
          },
        });
      }
    }

    const facturaActualizada = await tx.facturag.update({
      where: { FGId: factura.FGId },
      data: { FGSaldo: nuevoBalance },
      include: {
        cltemae: true,
        vendedor: true,
      },
    });

    return mapFacturaGToApi(facturaActualizada);
  });
};

/**
 * Obtiene todos los movimientos CXC de una factura y calcula el balance actual
 */
export const getMovimientosCXC = async (
  FGId: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la factura existe
    const factura = await tx.facturag.findUnique({
      where: {
        FGId: FGId,
      },
      include: {
        cltemae: true,
        vendedor: true,
      },
    });

    if (factura?.FGOrganizationId !== organizationId) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // 2. Obtener todos los movimientos CXC de la factura
    const movimientos = await tx.movCXC.findMany({
      where: {
        MCFacturaId: factura.FGId,
      },
      include: {
        tipoMovimiento: true,
      },
      orderBy: {
        creadoOModificado: "desc",
      },
    });

    // 3. Calcular balance actual
    const balance = await calcularBalanceFactura(
      factura.FGId,
      organizationId,
      tx,
    );

    return movimientos;
  });
};

/** True when the client has balance on at least one ACTIVE/OVERDUE invoice. */
export const clientHasOutstandingBalanceInvoices = async (
  clienteId: number,
  organizationId: string,
): Promise<boolean> => {
  const count = await prisma.facturag.count({
    where: {
      FGOrganizationId: organizationId,
      FGClienteId: clienteId,
      FGSaldo: { gt: 0 },
      FGEstado: { in: [EstadoFactura.ACTIVE, EstadoFactura.OVERDUE] },
    },
  });
  return count > 0;
};
