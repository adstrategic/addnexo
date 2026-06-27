import {
  EstadoFactura,
  Prisma,
  prisma,
  TipoPago,
  TipoPropositoMovkar,
} from "@repo/db";

import type { BillingDashboardQueryDto } from "./dashboard.validator.js";

import { roundTo } from "./dio.js";

export interface BillingDashboardRow {
  amount: number;
  client: string;
  due_date: string;
  id: string;
  invoice_number: string;
  issue_date: string;
  notes?: string;
  payment_method: "Bank Transfer" | "Cash" | "Check" | "Credit Card" | null;
  status: "overdue" | "paid" | "pending";
  tax: number;
  total: number;
}

export interface BillingDashboardResponse {
  filterOptions: {
    clients: string[];
    vendors: string[];
  };
  kpis: {
    outstandingAmount: number;
    paidAmount: number;
    totalInvoices: number;
    totalRevenue: number;
  };
  methodData: {
    amount: number;
    method: "Bank Transfer" | "Cash" | "Check" | "Credit Card";
  }[];
  monthlyData: {
    month: string;
    paid: number;
    revenue: number;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  rows: BillingDashboardRow[];
  statusStats: {
    overdue: number;
    paid: number;
    pending: number;
  };
}

interface BillingDashboardParams extends BillingDashboardQueryDto {
  organizationId: string;
}

const dbPaymentToUi: Partial<
  Record<TipoPago, BillingDashboardRow["payment_method"]>
> = {
  [TipoPago.TRANSFER]: "Bank Transfer",
  [TipoPago.CREDIT_CARD]: "Credit Card",
  [TipoPago.CHECK]: "Check",
  [TipoPago.CONTADO]: "Cash",
};

const toMonthLabel = (date: Date): string =>
  new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
    date,
  );

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const sortMonthKeys = (keys: string[]): string[] =>
  keys.sort(
    (a, b) => new Date(`01 ${a}`).getTime() - new Date(`01 ${b}`).getTime(),
  );

const buildBillingWhere = (
  params: BillingDashboardParams,
): Prisma.FacturagWhereInput => {
  const { organizationId, search, status, clientId, vendorId, dateFrom, dateTo } =
    params;
  const where: Prisma.FacturagWhereInput = {
    FGOrganizationId: organizationId,
    FGEstado: { not: EstadoFactura.ANULATED },
  };
  const getAndConditions = (): Prisma.FacturagWhereInput[] => {
    if (!where.AND) return [];
    return Array.isArray(where.AND) ? where.AND : [where.AND];
  };

  if (status === "paid") {
    where.OR = [{ FGEstado: EstadoFactura.PAID }, { FGSaldo: { lte: 0 } }];
  } else if (status === "overdue") {
    where.FGEstado = EstadoFactura.OVERDUE;
  } else if (status === "pending") {
    where.AND = [{ FGEstado: EstadoFactura.ACTIVE }, { FGSaldo: { gt: 0 } }];
  }

  if (clientId) {
    where.AND = [...getAndConditions(), { FGClienteId: clientId }];
  }

  if (vendorId) {
    where.AND = [...getAndConditions(), { FGVendedorId: vendorId }];
  }

  if (search) {
    const value = search.trim();
    const maybeNumber = parseInt(value, 10);
    const searchConditions: Prisma.FacturagWhereInput[] = [
      { FGPurchaseOrder: { contains: value, mode: "insensitive" } },
      { cltemae: { CRazonSocial: { contains: value, mode: "insensitive" } } },
      { cltemae: { CNombreCliente: { contains: value, mode: "insensitive" } } },
      { vendedor: { VNombre: { contains: value, mode: "insensitive" } } },
    ];
    if (!Number.isNaN(maybeNumber)) {
      searchConditions.push({ FGNro: maybeNumber });
      searchConditions.push({ FGOrgSecuencia: maybeNumber });
    }
    where.AND = [...getAndConditions(), { OR: searchConditions }];
  }

  if (dateFrom || dateTo) {
    where.FGFechaCreado = {};
    if (dateFrom) where.FGFechaCreado.gte = dateFrom;
    if (dateTo) where.FGFechaCreado.lte = dateTo;
  }

  return where;
};

const invoiceSelect = (abonoMovementTypeId: null | number) =>
  ({
    FGId: true,
    FGNro: true,
    FGFechaCreado: true,
    FGFechaVencimiento: true,
    FGEstado: true,
    FGValorTotalNeto: true,
    FGTotalIVA: true,
    FGSaldo: true,
    FGPurchaseOrder: true,
    cltemae: { select: { CRazonSocial: true, CNombreCliente: true } },
    vendedor: { select: { VNombre: true } },
    movCXC: {
      where: abonoMovementTypeId
        ? { MCTipoMovimientoId: abonoMovementTypeId }
        : undefined,
      orderBy: { MCFecha: "desc" },
      select: { MCTipoPago: true, MCValor: true, MCFecha: true },
    },
  }) satisfies Prisma.FacturagSelect;

export const getBillingDashboard = async (
  params: BillingDashboardParams,
): Promise<BillingDashboardResponse> => {
  const { page, pageSize, organizationId } = params;
  const skip = (page - 1) * pageSize;

  const abonoType = await prisma.tmovkar.findFirst({
    where: {
      TOrganizationId: organizationId,
      TProposito: TipoPropositoMovkar.ABONO,
    },
    select: { TId: true },
  });
  const abonoMovementTypeId = abonoType?.TId ?? null;
  const where = buildBillingWhere(params);
  const select = invoiceSelect(abonoMovementTypeId);

  // KPI/chart aggregations (revenue, status counts, per-month series, filter
  // options) need every matching invoice: months are grouped by display label,
  // which Prisma cannot group by without raw SQL. The select keeps the fetch
  // narrow.
  const [totalItems, invoicesPage, invoicesForAggregation] =
    await prisma.$transaction([
      prisma.facturag.count({ where }),
      prisma.facturag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { FGFechaCreado: "desc" },
        select,
      }),
      prisma.facturag.findMany({
        where,
        orderBy: { FGFechaCreado: "asc" },
        select,
      }),
    ]);

  const toClientName = (invoice: (typeof invoicesPage)[number]): string =>
    invoice.cltemae.CRazonSocial ||
    invoice.cltemae.CNombreCliente ||
    "Unknown client";

  const rows: BillingDashboardRow[] = invoicesPage.map((invoice) => {
    const latestPaymentType = invoice.movCXC[0]?.MCTipoPago;
    const paymentMethod = latestPaymentType
      ? (dbPaymentToUi[latestPaymentType] ?? null)
      : null;
    const total = Number(invoice.FGValorTotalNeto);
    const tax = Number(invoice.FGTotalIVA);
    const amount = total - tax;
    const balance = Number(invoice.FGSaldo);

    let status: BillingDashboardRow["status"] = "pending";
    if (invoice.FGEstado === EstadoFactura.OVERDUE) status = "overdue";
    else if (invoice.FGEstado === EstadoFactura.PAID || balance <= 0)
      status = "paid";

    return {
      id: String(invoice.FGId),
      invoice_number: `#${String(invoice.FGNro)}`,
      client: toClientName(invoice),
      issue_date: toDateOnly(invoice.FGFechaCreado),
      due_date: toDateOnly(invoice.FGFechaVencimiento),
      amount: roundTo(amount, 2),
      tax: roundTo(tax, 2),
      total: roundTo(total, 2),
      status,
      payment_method: paymentMethod,
      notes: invoice.FGPurchaseOrder ?? undefined,
    };
  });

  const totalRevenue = roundTo(
    invoicesForAggregation.reduce(
      (sum, invoice) => sum + Number(invoice.FGValorTotalNeto),
      0,
    ),
    2,
  );
  const outstandingAmount = roundTo(
    invoicesForAggregation.reduce((sum, invoice) => {
      const balance = Number(invoice.FGSaldo);
      return sum + (balance > 0 ? balance : 0);
    }, 0),
    2,
  );
  const paidAmount = roundTo(Math.max(totalRevenue - outstandingAmount, 0), 2);

  const statusStats = invoicesForAggregation.reduce(
    (acc, invoice) => {
      const balance = Number(invoice.FGSaldo);
      if (invoice.FGEstado === EstadoFactura.OVERDUE) acc.overdue += 1;
      else if (invoice.FGEstado === EstadoFactura.PAID || balance <= 0)
        acc.paid += 1;
      else acc.pending += 1;
      return acc;
    },
    { paid: 0, pending: 0, overdue: 0 },
  );

  const methodAccumulator = new Map<
    "Bank Transfer" | "Cash" | "Check" | "Credit Card",
    number
  >();
  const monthlyRevenueMap = new Map<
    string,
    { paid: number; revenue: number }
  >();

  for (const invoice of invoicesForAggregation) {
    const month = toMonthLabel(invoice.FGFechaCreado);
    const monthValue = monthlyRevenueMap.get(month) ?? { revenue: 0, paid: 0 };
    monthValue.revenue += Number(invoice.FGValorTotalNeto);

    for (const payment of invoice.movCXC) {
      const uiMethod = dbPaymentToUi[payment.MCTipoPago];
      if (uiMethod) {
        methodAccumulator.set(
          uiMethod,
          (methodAccumulator.get(uiMethod) ?? 0) + Number(payment.MCValor),
        );
      }
      const paidMonth = toMonthLabel(payment.MCFecha);
      const paidMonthValue = monthlyRevenueMap.get(paidMonth) ?? {
        revenue: 0,
        paid: 0,
      };
      paidMonthValue.paid += Number(payment.MCValor);
      monthlyRevenueMap.set(paidMonth, paidMonthValue);
    }

    monthlyRevenueMap.set(month, monthValue);
  }

  const monthlyData = sortMonthKeys(Array.from(monthlyRevenueMap.keys())).map(
    (month) => ({
      month,
      revenue: roundTo(monthlyRevenueMap.get(month)?.revenue ?? 0, 2),
      paid: roundTo(monthlyRevenueMap.get(month)?.paid ?? 0, 2),
    }),
  );

  const methodData = Array.from(methodAccumulator.entries()).map(
    ([method, amount]) => ({
      method,
      amount: roundTo(amount, 2),
    }),
  );

  const clients = Array.from(
    new Set(invoicesForAggregation.map(toClientName)),
  ).sort((a, b) => a.localeCompare(b));
  const vendors = Array.from(
    new Set(
      invoicesForAggregation
        .map((invoice) => invoice.vendedor.VNombre)
        .filter((vendorName) => vendorName.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    rows,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
    kpis: {
      totalInvoices: totalItems,
      totalRevenue,
      paidAmount,
      outstandingAmount,
    },
    statusStats,
    methodData,
    monthlyData,
    filterOptions: {
      clients,
      vendors,
    },
  };
};
