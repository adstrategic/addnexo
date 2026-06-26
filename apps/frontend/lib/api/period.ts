import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";

const BASE_URL = "/period";

export type Period = {
  mes: number;
  ano: number;
};

export type PeriodWithLabel = Period & {
  label: string;
};

export type AvailablePeriod = PeriodWithLabel & {
  closed: boolean;
};

export type ActivePeriodResponse = PeriodWithLabel & {
  closed: boolean;
};

export type ClosingStatusResponse = {
  periodsNeedingClose: PeriodWithLabel[];
  lastClosedPeriod: Period | null;
};

export type ZeroCostEntry = {
  movimientoId: number;
  secuencial: number;
  producto: string;
  fecha: string;
  cantidad: number;
  esCostoTemporalCero: boolean;
};

export type ValidatePreCloseResponse =
  | { valid: true }
  | { valid: false; entries: ZeroCostEntry[]; message: string };

export type ClosePeriodResponse = {
  message: string;
  kardexCreated: number;
  lotsCreated: number;
  newPeriod: PeriodWithLabel;
};

export const periodApi = {
  async getActive(): Promise<ActivePeriodResponse> {
    try {
      const { data } = await apiClient.get<ActivePeriodResponse>(
        `${BASE_URL}/active`,
      );
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async setActive(mes: number, ano: number): Promise<ActivePeriodResponse> {
    try {
      const { data } = await apiClient.post<ActivePeriodResponse>(
        `${BASE_URL}/active`,
        { mes, ano },
      );
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async listAvailable(): Promise<AvailablePeriod[]> {
    try {
      const { data } = await apiClient.get<{ data: AvailablePeriod[] }>(
        `${BASE_URL}/available`,
      );
      return data.data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async getStatus(): Promise<ClosingStatusResponse> {
    try {
      const { data } = await apiClient.get<ClosingStatusResponse>(
        `${BASE_URL}/status`,
      );
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async validateClose(
    mes: number,
    ano: number,
  ): Promise<ValidatePreCloseResponse> {
    try {
      const { data } = await apiClient.get<ValidatePreCloseResponse>(
        `${BASE_URL}/close/validate`,
        { params: { mes, ano } },
      );
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },

  async close(mes: number, ano: number): Promise<ClosePeriodResponse> {
    try {
      const { data } = await apiClient.post<ClosePeriodResponse>(
        `${BASE_URL}/close`,
        { mes, ano },
      );
      return data;
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  },
};
