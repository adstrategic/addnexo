import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateBalanceInvoiceHeaderData,
  UpdateBalanceInvoiceData,
} from "../schemas/BalanceInvoicesSchema";
import {
  balanceInvoiceResponseSchema,
  balanceInvoiceListResponseSchema,
  balanceInvoiceNextNumberResponseSchema,
  balanceInvoiceItemResponseSchema,
  type Factura,
  type ServerFacturasResponse,
  type TipoPago,
} from "../schemas/BalanceInvoicesResponseSchema";

const BASE_URL = "/balance-invoices";

function parseFactura(data: unknown): Factura {
  return balanceInvoiceResponseSchema.parse(data);
}

function parseFacturaItems(data: unknown): Factura["facturau"] {
  // Items endpoints return { items: [...] }
  const payload = (data as { items?: unknown }).items ?? data;
  return balanceInvoiceItemResponseSchema.array().parse(payload);
}

async function obtenerFacturas(params?: {
  page?: number;
  limit?: number;
  search?: string;
  estado?: string;
  clienteId?: number;
  vendedorId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<ServerFacturasResponse> {
  try {
    const { data } = await apiClient.get(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
        estado: params?.estado,
        clienteId: params?.clienteId,
        vendedorId: params?.vendedorId,
        fechaDesde: params?.fechaDesde,
        fechaHasta: params?.fechaHasta,
      },
    });
    return balanceInvoiceListResponseSchema.parse(data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function obtenerFactura(secuencia: number): Promise<Factura> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${secuencia}`);
    return parseFactura(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function obtenerSiguienteNumero(): Promise<number> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/siguiente-numero`);
    const result = balanceInvoiceNextNumberResponseSchema.parse(data);
    return result.siguienteNumero;
  } catch (error) {
    handleApiError(error);
  }
}

async function crearFacturaHeader(
  dto: CreateBalanceInvoiceHeaderData,
): Promise<Factura> {
  try {
    const { data } = await apiClient.post(`${BASE_URL}/headers`, dto);
    // Create endpoint returns { factura: ... }
    const payload = (data as { factura?: unknown }).factura ?? data;
    return parseFactura(payload);
  } catch (error) {
    handleApiError(error);
  }
}

async function actualizarFactura(
  id: number,
  dto: UpdateBalanceInvoiceData,
): Promise<Factura> {
  try {
    const { data } = await apiClient.put(`${BASE_URL}/${id}`, dto);
    return parseFactura(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function eliminarFactura(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}

async function agregarFacturaItem(
  facturaId: number,
  itemData: { FUInvcaruniId: number; FUVrUnitario: number },
): Promise<Factura["facturau"]> {
  try {
    const { data } = await apiClient.post(
      `${BASE_URL}/${facturaId}/items`,
      itemData,
    );
    return parseFacturaItems(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function actualizarFacturaItem(
  facturaId: number,
  itemId: number,
  updateData: { FUVrUnitario?: number },
): Promise<Factura["facturau"]> {
  try {
    const { data } = await apiClient.put(
      `${BASE_URL}/${facturaId}/items/${itemId}`,
      updateData,
    );
    return parseFacturaItems(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function eliminarFacturaItem(
  facturaId: number,
  itemId: number,
): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${facturaId}/items/${itemId}`);
  } catch (error) {
    handleApiError(error);
  }
}

async function downloadFacturaPDF(secuencia: number): Promise<void> {
  try {
    const { data } = await apiClient.get(`${BASE_URL}/${secuencia}/pdf`, {
      responseType: "blob",
    });
    const blob = data as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${secuencia}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    handleApiError(error);
  }
}

export const facturaApi = {
  obtenerFacturas,
  obtenerFactura,
  obtenerSiguienteNumero,
  crearFacturaHeader,
  actualizarFactura,
  eliminarFactura,
  agregarFacturaItem,
  actualizarFacturaItem,
  eliminarFacturaItem,
  downloadFacturaPDF,
  /** @internal Exported for tests — prefer service methods */
  parseFactura,
};

export const facturaUtils = {
  obtenerTipoPagoLabel: (tipo: TipoPago): string => {
    const labels: Record<TipoPago, string> = {
      CONTADO: "Cash",
      CANJE: "Exchange",
      CREDITO: "Credit",
      WALLET: "Wallet",
      CREDIT_CARD: "Credit Card",
      TRANSFER: "Transfer",
      CHECK: "Check",
    };
    return labels[tipo];
  },

  calcularTotalFactura: (factura: Factura): number => {
    if (!factura.facturau || factura.facturau.length === 0) return 0;
    return factura.facturau.reduce(
      (total, item) => total + Number(item.FUVrBruto ?? 0),
      0,
    );
  },
};

export default facturaApi;
