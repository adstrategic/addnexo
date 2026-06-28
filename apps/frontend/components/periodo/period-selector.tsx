"use client";

import { useState } from "react";
import { Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PeriodoItem } from "@/lib/api/periodo";

const MES_NOMBRES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PeriodSelectorProps {
  periodos: PeriodoItem[];
  onSelect: (mes: number, ano: number) => Promise<void>;
}

export function PeriodSelector({ periodos, onSelect }: PeriodSelectorProps) {
  const [selecting, setSelecting] = useState<string | null>(null);

  const now = new Date();
  const currentMes = now.getMonth() + 1;
  const currentAno = now.getFullYear() % 100;

  const handleSelect = async (mes: number, ano: number) => {
    const key = `${mes}-${ano}`;
    setSelecting(key);
    try {
      await onSelect(mes, ano);
    } catch (error: any) {
      toast.error(error.message || "Error selecting the period");
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Select Working Period</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose the month and year you want to work in
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {periodos.map((p) => {
          const key = `${p.mes}-${p.ano}`;
          const isCurrentMonth = p.mes === currentMes && p.ano === currentAno;
          const isLoading = selecting === key;

          return (
            <button
              key={key}
              onClick={() => handleSelect(p.mes, p.ano)}
              disabled={!!selecting}
              className={[
                "flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors text-left",
                isCurrentMonth
                  ? "border-teal-500 bg-teal-50 text-teal-700 font-medium"
                  : "border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50 text-gray-700",
                selecting && !isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : (
                <Calendar size={14} className="shrink-0" />
              )}
              <span>{p.label || `${MES_NOMBRES[p.mes - 1]} ${2000 + p.ano}`}</span>
              {isCurrentMonth && (
                <span className="ml-auto text-xs bg-teal-200 text-teal-800 px-1.5 py-0.5 rounded">
                  Current
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
