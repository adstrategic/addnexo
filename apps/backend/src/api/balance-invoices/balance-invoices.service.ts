import { EstadoFactura, prisma, Prisma } from "@repo/db";

import type {
  ActualizarSaldosFacturaDto,
  AgregarSaldosFacturaItemDto,
  CrearSaldosFacturaHeaderDto,
  ListSaldosFacturasQuery,
  SaldosFacturaItemDto,
} from "./balance-invoices.validator.js";

import {
  EntityNotFoundError,
  EntityValidationError,
  FieldValidationError,
} from "../../errors/EntityErrors.js";
import {
  mapFacturagToApi,
  mapFacturauListToApi,
} from "./balance-invoices.mapper.js";

// ===== INTERFACES =====

interface CalculatedTotals {
  facturau: {
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

interface ListSaldosFacturasOptions extends ListSaldosFacturasQuery {
  limit: number;
  organizationId: string;
}

// ===== SERVICIOS DE LISTADO Y CONSULTA =====

/**
 * Lista todas las facturas con paginación y filtros
 */
export const listSaldosFacturas = async (
  options: ListSaldosFacturasOptions,
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

  const where: Prisma.FacturagWhereInput = {
    FGOrganizationId: organizationId,
    FGFacturaDeSaldo: true,
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

  if (fechaDesde || fechaHasta) {
    where.FGFechaCreado = {};
    if (fechaDesde) {
      where.FGFechaCreado.gte = fechaDesde;
    }
    if (fechaHasta) {
      where.FGFechaCreado.lte = fechaHasta;
    }
  }

  if (search) {
    const searchNumber = parseInt(search);
    const isNumber = !isNaN(searchNumber);
    where.OR = [
      { FGPurchaseOrder: { contains: search, mode: "insensitive" } },
      ...(isNumber ? [{ FGNro: searchNumber }] : []),
    ];
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
        movCXC: {
          take: 1,
        },
      },
    }),
    prisma.facturag.count({ where }),
  ]);

  return { facturas: facturas.map(mapFacturagToApi), total };
};

/**
 * Obtiene una factura por su secuencia en la organización
 */
export const getSaldosFacturaBySecuencia = async (
  orgSecuencia: number,
  organizationId: string,
) => {
  // 1. Obtener factura con todos los items
  const factura = await prisma.facturag.findUnique({
    where: {
      FGOrganizationId_FGOrgSecuencia: {
        FGOrganizationId: organizationId,
        FGOrgSecuencia: orgSecuencia,
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
    },
  });

  if (!factura) {
    throw new EntityNotFoundError("Invoice not found");
  }

  return mapFacturagToApi(factura);
};

/**
 * Obtiene el siguiente número de factura disponible
 * Basado en COBOL lines 174-180
 */
export const getSiguienteNumeroFactura = async (organizationId: string) => {
  const ultimoFactura = await prisma.facturag.findFirst({
    where: { FGOrganizationId: organizationId },
    orderBy: { FGNro: "desc" },
  });

  return (ultimoFactura?.FGNro || 0) + 1;
};

// ===== CÁLCULOS DE TOTALES =====

/**
 * Calcula totales de factura según lógica COBOL
 * Basado en COBOL lines 631-670
 */
export const calculateInvoiceTotals = async (
  tx: Prisma.TransactionClient,
  items: SaldosFacturaItemDto[],
  organizationId: string,
  isManual: boolean,
): Promise<CalculatedTotals> => {
  const calculatedItems = [];
  let valorTotalNeto = 0;
  let valorTotalBruto = 0;

  // Collect all unique product IDs
  const productIds = [...new Set(items.map((item) => item.FUInvcaruniId))];

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
    const producto = productosMap.get(item.FUInvcaruniId);

    if (!producto) {
      throw new EntityNotFoundError(
        `Product with ID ${item.FUInvcaruniId} not found`,
      );
    }

    // Always use DOUCantidad for both manual and automatic modes
    const cantidadProducto = item.FUCantidad;

    if (cantidadProducto === 0) {
      throw new EntityValidationError(
        `Quantity is required for product ${producto.CKDescripcion}`,
      );
    }

    // Validar descuento contra tope permitido (COBOL lines 563-569)
    if (Number(producto.CKPorcenMargenTopeDesc) > 0) {
      if (item.FUDescuento > Number(producto.CKPorcenMargenTopeDesc)) {
        throw new EntityValidationError(
          `Discount ${item.FUDescuento}% exceeds maximum allowed ${producto.CKPorcenMargenTopeDesc}% for ${producto.CKDescripcion}`,
        );
      }
    }

    let subtotalBrutoItem = cantidadProducto * item.FUVrUnitario;

    // Calcular descuento
    if (item.FUDescuento > 0) {
      const valorDescuento = item.FUVrUnitario * (item.FUDescuento / 100);

      // Determinar precio según tipo de pago (COBOL lines 366-369)
      const precio = item.FUVrUnitario - valorDescuento;
      subtotalBrutoItem = cantidadProducto * precio;
    }

    // Calcular precio sin IVA si el producto tiene IVA (COBOL lines 639-642)
    const productoTieneIva = Number(producto.CKIva) > 0;
    // Calcular IVA (COBOL lines 652-663)
    let valorIva = 0;
    if (productoTieneIva && item.FUTieneImpuesto) {
      valorIva = subtotalBrutoItem * (Number(producto.CKIva) / 100);
    }

    // Total del item
    const totalBrutoItem = subtotalBrutoItem + valorIva;

    calculatedItems.push({
      productoId: item.FUInvcaruniId,
      cantidad: cantidadProducto,
      precioNeto: item.FUVrUnitario * cantidadProducto,
      precioBruto: totalBrutoItem,
      precioUnitario: item.FUVrUnitario,
      descuento: item.FUDescuento,
      tieneIva: item.FUTieneImpuesto && productoTieneIva,
    });

    valorTotalNeto += item.FUVrUnitario * cantidadProducto;
    valorTotalBruto += totalBrutoItem;
  }

  return {
    facturau: calculatedItems,
    valorTotalNeto,
    valorTotalBruto,
  };
};

// ===== CREACIÓN Y ACTUALIZACIÓN =====

/**
 * Actualiza una factura en estado DRAFT
 */
export const updateSaldosFactura = async (
  id: number,
  data: ActualizarSaldosFacturaDto,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Buscar factura
    const factura = await tx.facturag.findUnique({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: id,
        },
      },
      include: {
        movCXC: true,
      },
    });

    if (!factura) {
      throw new EntityNotFoundError("Invoice not found");
    }

    // 2. Validar que sea una factura de saldo
    if (!factura.FGFacturaDeSaldo) {
      throw new EntityValidationError("Can only update balance invoices");
    }

    if (factura.movCXC.length > 0) {
      throw new EntityValidationError(
        "Can only update balance invoices that have no payments",
      );
    }

    const { FGValorTotal, ...updateHeaderData } = data;

    const dataToUpdate = {
      ...updateHeaderData,

      ...(FGValorTotal && {
        FGValorTotalNeto: FGValorTotal,
        FGValorTotalBruto: FGValorTotal,
      }),
    };

    // 4. Actualizar header
    const facturaActualizada = await tx.facturag.update({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: id,
        },
      },
      data: dataToUpdate,
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
    });

    return mapFacturagToApi(facturaActualizada);
  });
};

// ===== NUEVAS FUNCIONES PARA PERSISTENCIA EN TIEMPO REAL =====

/** Optional split totals / SKU for imports or tools (API omits this; defaults match legacy behavior). */
export interface CreateSaldosFacturaHeaderOptions {
  /** FGSaldo on facturag (defaults to data.FGValorTotal). */
  facturaSaldo?: number;
  /** Load invcaruni by CKId + org instead of first grupo 999 product. */
  facturauInvcaruniCkId?: number;
  /** facturau FUVrNeto / FUVrBruto / FUVrUnitario (defaults to data.FGValorTotal). */
  facturauMonto?: number;
  /** FGValorTotalNeto / FGValorTotalBruto on facturag (defaults to data.FGValorTotal). */
  facturaValorNetoBruto?: number;
}

/**
 * Crea solo el encabezado (header) de una factura en estado DRAFT
 */
export const createSaldosFacturaHeader = async (
  data: CrearSaldosFacturaHeaderDto,
  organizationId: string,
  usuario: string,
  options?: CreateSaldosFacturaHeaderOptions,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que el cliente existe
    const cliente = await tx.cltemae.findUnique({
      where: { CId: data.FGClienteId },
    });
    if (cliente?.COrganizationId !== organizationId) {
      throw new EntityNotFoundError(
        "Customer not found or does not belong to organization",
      );
    }

    // 2. Validar vendedor
    const vendedor = await tx.vendedor.findUnique({
      where: { VId: data.FGVendedorId },
    });
    if (vendedor?.VOrganizationId !== organizationId) {
      throw new EntityNotFoundError(
        "Vendor not found or does not belong to organization",
      );
    }

    // 3. Obtener siguiente secuencia
    const ultimoSecuencia = await tx.facturag.findFirst({
      where: { FGOrganizationId: organizationId },
      orderBy: { FGOrgSecuencia: "desc" },
    });
    const siguienteSecuencia = (ultimoSecuencia?.FGOrgSecuencia || 0) + 1;

    const valorNetoBruto = options?.facturaValorNetoBruto ?? data.FGValorTotal;
    const saldoHeader = options?.facturaSaldo ?? data.FGValorTotal;
    const montoLinea = options?.facturauMonto ?? data.FGValorTotal;

    // 3. Crear factura header
    const factura = await tx.facturag.create({
      data: {
        FGOrganizationId: organizationId,
        FGNro: data.FGNro,
        FGOrgSecuencia: siguienteSecuencia,
        FGClienteId: data.FGClienteId,
        FGVendedorId: data.FGVendedorId,
        FGPurchaseOrder: data.FGPurchaseOrder,
        FGPago: data.FGPago,
        FGValorTotalNeto: valorNetoBruto,
        FGValorTotalBruto: valorNetoBruto,
        FGTotalDescuento: 0,
        FGTotalIVA: 0,
        FGSaldo: saldoHeader,
        FGEstado: EstadoFactura.ACTIVE,
        FGFacturaDeSaldo: true,
        FGTelefono1: data.FGTelefono1,
        FGTelefono2: data.FGTelefono2 || null,
        FGCorreo1: data.FGCorreo1,
        FGCorreo2: data.FGCorreo2 || null,
        FGDireccionEntrega: data.FGDireccionEntrega,
        FGCiudadId: data.FGCiudadId,
        FGCondicion1: data.FGCondicion1 || null,
        FGCondicion2: data.FGCondicion2 || null,
        FGCondicion3: data.FGCondicion3 || null,
        FGFechaCreado: data.FGFechaCreado,
        FGFechaVencimiento: data.FGFechaVencimiento,
        usuario,
      },
      include: {
        cltemae: true,
        vendedor: true,
        facturau: true,
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

    // 4. Crear item de factura
    let producto;
    if (options?.facturauInvcaruniCkId != null) {
      producto = await tx.invcaruni.findFirst({
        where: {
          CKId: options.facturauInvcaruniCkId,
          CKOrganizationId: organizationId,
        },
      });
      if (!producto) {
        throw new EntityNotFoundError(
          `Balance SKU not found (invcaruni CKId ${options.facturauInvcaruniCkId} for organization)`,
        );
      }
    } else {
      producto = await tx.invcaruni.findFirst({
        where: {
          grupo: {
            GNro: 999,
          },
          CKOrganizationId: organizationId,
        },
      });
      if (!producto) {
        throw new EntityNotFoundError("Balance item not found");
      }
    }

    await tx.facturau.create({
      data: {
        FUFacturaId: factura.FGId,
        FUOrganizationId: organizationId,
        FUInvcaruniId: producto.CKId,
        FUNro: factura.FGNro,
        FUCantidad: 1,
        FUVrNeto: montoLinea,
        FUVrBruto: montoLinea,
        FUVrUnitario: montoLinea,
        FUDescuento: 0,
        FUDetalle: "",
        FUTieneImpuesto: false,
        FULote: "0",
        FULoteNroDocumento: "",
        FUCostoPromedio: 0,
        usuario,
      },
    });

    return mapFacturagToApi(factura);
  });
};

/**
 * Agrega un item a una factura existente
 * Para facturas manuales: solo acepta 1 item del grupo 999, cantidad siempre es 1
 * No crea movimientos de inventario
 */
export const addSaldosFacturaItem = async (
  facturaSequence: number,
  item: AgregarSaldosFacturaItemDto,
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar que la factura existe y está en DRAFT
    const factura = await tx.facturag.findUnique({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: facturaSequence,
        },
      },
      include: {
        facturau: true,
        movCXC: true,
      },
    });

    if (!factura) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (!factura.FGFacturaDeSaldo) {
      throw new EntityValidationError("Can only add items to balance invoices");
    }

    if (factura.movCXC.length > 0) {
      throw new EntityValidationError(
        "Can only add items to balance invoices that have no payments",
      );
    }

    // 2. Validar que el producto existe
    const producto = await tx.invcaruni.findFirst({
      where: {
        CKId: item.FUInvcaruniId,
        CKOrganizationId: organizationId,
      },
      include: {
        grupo: true,
      },
    });

    if (!producto) {
      throw new EntityNotFoundError("Product not found");
    }

    // TODO: Validar que el producto pertenezca al grupo 999
    if (producto.grupo.GNro !== 999) {
      throw new FieldValidationError({
        message:
          "Only products from group 999 are allowed for balance invoices",
        fields: {
          FUInvcaruniId: [
            "Only products from group 999 are allowed for balance invoices",
          ],
        },
        code: "ERR_VALID",
        statusCode: 400,
      });
    }

    await tx.facturau.create({
      data: {
        FUCostoPromedio: 0,
        FUFacturaId: factura.FGId,
        FUOrganizationId: organizationId,
        FUInvcaruniId: item.FUInvcaruniId,
        FUNro: factura.FGNro,
        FUCantidad: 1,
        FUVrNeto: item.FUVrUnitario,
        FUVrBruto: item.FUVrUnitario,
        FUVrUnitario: item.FUVrUnitario,
        FUDescuento: 0,
        FUDetalle: "",
        FUTieneImpuesto: false,
        FULote: "0",
        FULoteNroDocumento: "",
        usuario,
      },
    });

    // await tx.facturag.update({
    //   where: {
    //     FGOrganizationId_FGOrgSecuencia: {
    //       FGOrganizationId: organizationId,
    //       FGOrgSecuencia: facturaSequence,
    //     },
    //   },
    //   data: {
    //     FGValorTotalNeto: item.FUVrUnitario,
    //     FGValorTotalBruto: item.FUVrUnitario,
    //   },
    // });

    return mapFacturagToApi(factura);
  });
};

/**
 * Actualiza un item existente de una factura
 * Puede actualizar: precio unitario
 * Nota: La cantidad siempre es 1 para facturas manuales
 */
export const updateSaldosFacturaItem = async (
  facturaSequence: number,
  itemId: number,
  updateData: {
    FUVrUnitario: number;
  },
  organizationId: string,
  usuario: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Validar factura
    const factura = await tx.facturag.findUnique({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: facturaSequence,
        },
      },
      include: {
        movCXC: true,
      },
    });

    if (!factura) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (!factura.FGFacturaDeSaldo) {
      throw new EntityValidationError(
        "Can only update items in balance invoices",
      );
    }

    if (factura.movCXC.length > 0) {
      throw new EntityValidationError(
        "Can only update items in balance invoices that have no payments",
      );
    }

    // 2. Obtener item actual
    const itemActual = await tx.facturau.findUnique({
      where: {
        FUId: itemId,
      },
      include: {
        invcaruni: true,
      },
    });

    if (!itemActual) {
      throw new EntityNotFoundError("Item not found");
    }

    if (
      itemActual.FUNro !== factura.FGNro ||
      itemActual.FUOrganizationId !== organizationId
    ) {
      throw new EntityValidationError("Item does not belong to this invoice");
    }

    // Actualizar item
    const itemActualizado = await tx.facturau.update({
      where: {
        FUId: itemId,
      },
      data: {
        FUVrUnitario: updateData.FUVrUnitario,
        FUVrNeto: updateData.FUVrUnitario,
        FUVrBruto: updateData.FUVrUnitario,
      },
      include: {
        invcaruni: true,
      },
    });

    // Recalcular totales
    await tx.facturag.update({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: facturaSequence,
        },
      },
      data: {
        FGSaldo: itemActualizado.FUVrNeto,
      },
    });

    return mapFacturauListToApi([itemActualizado]);
  });
};

/**
 * Elimina una dispatch order en estado DRAFT
 */
export const deleteSaldosFactura = async (
  id: number,
  organizationId: string,
) => {
  return prisma.$transaction(async (tx) => {
    const factura = await tx.facturag.findUnique({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: id,
        },
      },
      include: {
        movCXC: true,
      },
    });

    if (!factura) {
      throw new EntityNotFoundError("Invoice not found");
    }

    if (!factura.FGFacturaDeSaldo) {
      throw new EntityValidationError("Can only delete balance invoices");
    }

    if (factura.movCXC.length > 0) {
      throw new EntityValidationError(
        "Can only delete balance invoices that have no payments",
      );
    }

    // Eliminar items primero
    await tx.facturau.deleteMany({
      where: {
        FUNro: factura.FGNro,
        FUOrganizationId: organizationId,
      },
    });

    // Eliminar factura
    await tx.facturag.delete({
      where: {
        FGOrganizationId_FGOrgSecuencia: {
          FGOrganizationId: organizationId,
          FGOrgSecuencia: id,
        },
      },
    });
  });
};
