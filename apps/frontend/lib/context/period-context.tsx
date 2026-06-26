"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  periodApi,
  type ActivePeriodResponse,
  type Period,
} from "@/lib/api/period";

export type PeriodContextValue = {
  mes: number;
  ano: number;
  label: string;
  closed: boolean;
  loading: boolean;
  setActivePeriod: (mes: number, ano: number) => Promise<void>;
  refreshPeriod: () => Promise<void>;
};

const PeriodContext = createContext<PeriodContextValue | null>(null);

function buildFallbackLabel(mes: number, ano: number): string {
  const monthNames = [
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
  const year = ano >= 100 ? ano : 2000 + ano;
  return `${monthNames[mes - 1] ?? mes} ${year}`;
}

function applyActivePeriod(
  setState: React.Dispatch<
    React.SetStateAction<Omit<PeriodContextValue, "setActivePeriod" | "refreshPeriod">>
  >,
  data: ActivePeriodResponse,
) {
  setState((prev) => ({
    ...prev,
    mes: data.mes,
    ano: data.ano,
    label: data.label,
    closed: data.closed,
    loading: false,
  }));
}

export function PeriodProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const generationRef = useRef(0);
  const [state, setState] = useState<
    Omit<PeriodContextValue, "setActivePeriod" | "refreshPeriod">
  >({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear() % 100,
    label: buildFallbackLabel(
      new Date().getMonth() + 1,
      new Date().getFullYear() % 100,
    ),
    closed: false,
    loading: true,
  });

  const refreshPeriod = useCallback(async () => {
    const generation = ++generationRef.current;
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const data = await periodApi.getActive();
      if (generation !== generationRef.current) {
        return;
      }
      applyActivePeriod(setState, data);
    } catch {
      if (generation !== generationRef.current) {
        return;
      }
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refreshPeriod();
  }, [refreshPeriod]);

  const setActivePeriod = useCallback(
    async (mes: number, ano: number) => {
      const previous: Period = { mes: state.mes, ano: state.ano };
      const previousLabel = state.label;
      const previousClosed = state.closed;

      setState((prev) => ({
        ...prev,
        mes,
        ano,
        label: buildFallbackLabel(mes, ano),
        loading: true,
      }));

      try {
        await periodApi.setActive(mes, ano);
        await refreshPeriod();
        // All reads are period-scoped server-side; refetch everything so no
        // page keeps showing the previous period's data.
        await queryClient.invalidateQueries();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          mes: previous.mes,
          ano: previous.ano,
          label: previousLabel,
          closed: previousClosed,
          loading: false,
        }));
        throw error;
      }
    },
    [queryClient, refreshPeriod, state.ano, state.closed, state.label, state.mes],
  );

  const value = useMemo<PeriodContextValue>(
    () => ({
      ...state,
      setActivePeriod,
      refreshPeriod,
    }),
    [refreshPeriod, setActivePeriod, state],
  );

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
}
