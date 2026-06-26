// features/invoices/services/invoices.api.ts
import { z } from "zod";
import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";

import type { CreateInvoiceData } from "../schemas/InvoicesSchemas";
import {
  serverInvoiceSchema,
  serverInvoicesResponseSchema,
  outstandingClientsResponseSchema,
} from "../schemas/invoices-response.schema";
import type {
  ServerInvoice,
  ServerInvoicesResponse,
  ListInvoicesParams,
} from "../schemas/invoices-response.schema";

const BASE_URL = "/invoices";
const REMINDER_CONFIG_URL = "/reminder-config";

/** Statement reminder configuration (Organization-level). */
export const reminderConfigSchema = z.object({
  statementScheduledRemindersEnabled: z.boolean(),
  statementClientScope: z.enum(["overdue", "balance"]),
});
export type ReminderConfig = z.infer<typeof reminderConfigSchema>;
export type UpdateReminderConfig = Partial<ReminderConfig>;

export const invoiceApi = {
  // Get all invoices with pagination and filters
  async obtenerInvoices(
    params?: ListInvoicesParams,
  ): Promise<ServerInvoicesResponse> {
    try {
      const { data } = await apiClient.get(BASE_URL, {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit,
          search: params?.search,
          estado: params?.estado,
          clienteId: params?.clienteId,
          vendedorId: params?.vendedorId,
          dateFrom: params?.dateFrom,
          dateTo: params?.dateTo,
        },
      });
      return serverInvoicesResponseSchema.parse(data);
    } catch (error) {
      console.error(error);
      handleApiError(error);
    }
  },

  // Get invoice by sequence
  async obtenerInvoice(secuencia: number): Promise<ServerInvoice> {
    try {
      const { data } = await apiClient.get(`${BASE_URL}/${secuencia}`);
      return serverInvoiceSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Create new invoice
  async crearInvoice(data: CreateInvoiceData): Promise<ServerInvoice> {
    try {
      const { data: responseData } = await apiClient.post(BASE_URL, data);
      return serverInvoiceSchema.parse(responseData);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Download invoice PDF (triggers browser download)
  async downloadInvoicePDF(secuencia: number): Promise<void> {
    try {
      const { data } = await apiClient.get(`${BASE_URL}/${secuencia}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${secuencia}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Send statement by email for a client
  async enviarStatement(clienteId: number, email: string): Promise<void> {
    try {
      await apiClient.post(`${BASE_URL}/statement/send`, { clienteId, email });
    } catch (error) {
      handleApiError(error);
    }
  },

  // Clients eligible for statement send: at least one invoice with an outstanding balance (overdue or not)
  async obtenerClienteIdsConSaldoPendiente(): Promise<number[]> {
    try {
      const { data } = await apiClient.get(
        `${BASE_URL}/statement/clients-with-outstanding`,
      );
      return outstandingClientsResponseSchema.parse(data).clienteIds;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get presigned URL for downloading an invoice document
  async getDocumentDownloadUrl(
    documentId: number,
  ): Promise<{ url: string; fileName?: string; mimeType?: string }> {
    try {
      const { data } = await apiClient.get(
        `${BASE_URL}/documents/${documentId}/download`,
      );
      return data;
    } catch (error) {
      handleApiError(error);
    }
  },

  // Delete an invoice document
  async deleteDocument(documentId: number): Promise<void> {
    try {
      await apiClient.delete(`${BASE_URL}/documents/${documentId}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Get the organization's statement reminder configuration
  async getReminderConfig(): Promise<ReminderConfig> {
    try {
      const { data } = await apiClient.get(REMINDER_CONFIG_URL);
      return reminderConfigSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },

  // Update the organization's statement reminder configuration
  async updateReminderConfig(
    patch: UpdateReminderConfig,
  ): Promise<ReminderConfig> {
    try {
      const { data } = await apiClient.patch(REMINDER_CONFIG_URL, patch);
      return reminderConfigSchema.parse(data);
    } catch (error) {
      handleApiError(error);
    }
  },
};

// React Query key factory for the invoices feature.
export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params?: ListInvoicesParams) =>
    [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (secuencia: number) => [...invoiceKeys.details(), secuencia] as const,
  statementOutstandingClients: () =>
    [...invoiceKeys.all, "statement", "clients-with-outstanding"] as const,
  reminderConfig: () => [...invoiceKeys.all, "reminder-config"] as const,
};

// Utility functions
export const invoiceUtils = {
  // Get payment type label
  obtenerTipoPagoLabel: (
    tipo:
      | "CONTADO"
      | "CANJE"
      | "CREDITO"
      | "WALLET"
      | "CREDIT_CARD"
      | "TRANSFER"
      | "CHECK"
      | undefined,
  ): string => {
    if (tipo === "CONTADO") return "Cash";
    if (tipo === "CANJE") return "Exchange";
    if (tipo === "CREDITO") return "Credit";
    if (tipo === "WALLET") return "Digital Wallet";
    if (tipo === "CREDIT_CARD") return "Credit Card";
    if (tipo === "TRANSFER") return "Bank Transfer";
    if (tipo === "CHECK") return "Check";
    return "Unknown";
  },

  // Calculate invoice total from items
  calcularTotalInvoice: (invoice: ServerInvoice): number => {
    if (!invoice.facturau || invoice.facturau.length === 0) return 0;
    return invoice.facturau.reduce(
      (total, item) => total + Number(item.FUVrBruto),
      0,
    );
  },
};

export default invoiceApi;
