"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { periodoApi, type PeriodoActivo } from "@/lib/api/periodo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeriodoContextValue {
  /** Active working month (1–12). */
  mes: number;
  /** Active working year (2-digit, e.g. 25 for 2025). */
  ano: number;
  /** Human-readable label, e.g. "Mayo 2025". */
  label: string;
  /** True if the active period has been formally closed (movements blocked). */
  cerrado: boolean;
  /** True while the initial fetch is pending. */
  loading: boolean;
  /** Re-fetches the active period from the server. */
  refreshPeriodo: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PeriodoContext = createContext<PeriodoContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PeriodoProvider({ children }: { children: ReactNode }) {
  const now = new Date();
  const [periodo, setPeriodo] = useState<PeriodoActivo>({
    mes: now.getMonth() + 1,
    ano: now.getFullYear() % 100,
    label: "",
    cerrado: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchPeriodo = useCallback(async () => {
    try {
      const { data } = await periodoApi.getActivo();
      setPeriodo(data);
    } catch {
      // Keep the calendar-month default on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriodo();
  }, [fetchPeriodo]);

  return (
    <PeriodoContext.Provider
      value={{
        mes: periodo.mes,
        ano: periodo.ano,
        label: periodo.label,
        cerrado: periodo.cerrado,
        loading,
        refreshPeriodo: fetchPeriodo,
      }}
    >
      {children}
    </PeriodoContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePeriodo(): PeriodoContextValue {
  const ctx = useContext(PeriodoContext);
  if (!ctx) {
    throw new Error("usePeriodo must be used within a PeriodoProvider");
  }
  return ctx;
}
