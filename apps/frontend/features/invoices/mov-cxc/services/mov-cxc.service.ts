import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";

import { serverInvoiceSchema } from "../../schemas/invoices-response.schema";
import type { ServerInvoice } from "../../schemas/invoices-response.schema";
import type {
  PaymentSubmitData,
  DebitNoteSubmitData,
  CreditNoteSubmitData,
  CreditNoteWithReturnSubmitData,
} from "../schemas/mov-cxc-schema";

const BASE_URL = "/invoices";

/** Item available to return on a credit note (GET /:id/items-disponibles-devolucion). */
export interface InvoiceReturnableItem {
  FUId: number;
  producto: {
    CKId: number;
    CKDescripcion: string;
    grupo?: unknown;
    unidadDeMedida?: unknown;
  };
  lote: number;
  cantidadOriginal: number;
  cantidadYaDevuelta: number;
  cantidadDisponible: number;
  precioUnitario: number;
  tieneImpuesto: boolean;
}

export const movCxcApi = {
  // Register a payment for an invoice
  async registrarPago(
    invoiceId: number,
    data: PaymentSubmitData,
  ): Promise<ServerInvoice> {
    try {
      const { data: responseData } = await apiClient.post(
        `${BASE_URL}/${invoiceId}/pagos`,
        data,
      );
      return serverInvoiceSchema.parse(responseData);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Register a debit note for an invoice
  async registrarNotaDebito(
    invoiceId: number,
    data: DebitNoteSubmitData,
  ): Promise<ServerInvoice> {
    try {
      const { data: responseData } = await apiClient.post(
        `${BASE_URL}/${invoiceId}/notas-debito`,
        data,
      );
      return serverInvoiceSchema.parse(responseData);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Register a simple credit note
  async registrarNotaCredito(
    invoiceId: number,
    data: CreditNoteSubmitData,
  ): Promise<ServerInvoice> {
    try {
      const { data: responseData } = await apiClient.post(
        `${BASE_URL}/${invoiceId}/notas-credito`,
        data,
      );
      return serverInvoiceSchema.parse(responseData);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get available items for return
  async obtenerItemsInvoiceParaDevolucion(
    invoiceId: number,
  ): Promise<InvoiceReturnableItem[]> {
    try {
      const { data } = await apiClient.get(
        `${BASE_URL}/${invoiceId}/items-disponibles-devolucion`,
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Register credit note with inventory return
  async registrarNotaCreditoConDevolucion(
    invoiceId: number,
    data: CreditNoteWithReturnSubmitData,
  ): Promise<ServerInvoice> {
    try {
      const { data: responseData } = await apiClient.post(
        `${BASE_URL}/${invoiceId}/notas-credito-con-devolucion`,
        data,
      );
      return serverInvoiceSchema.parse(responseData);
    } catch (error) {
      handleApiError(error);
    }
  },
};

export default movCxcApi;
