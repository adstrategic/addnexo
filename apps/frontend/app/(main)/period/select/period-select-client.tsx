"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ClosingModal } from "@/components/period/ClosingModal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  periodApi,
  type AvailablePeriod,
  type PeriodWithLabel,
} from "@/lib/api/period";
import { usePeriod } from "@/lib/context/period-context";

export default function PeriodSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackURL") || "/";
  const { setActivePeriod } = usePeriod();

  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<AvailablePeriod[]>([]);
  const [periodsNeedingClose, setPeriodsNeedingClose] = useState<
    PeriodWithLabel[]
  >([]);
  // Interception target: only set when the user picks the current month while a
  // prior month is still unclosed.
  const [closingPeriod, setClosingPeriod] = useState<PeriodWithLabel | null>(
    null,
  );
  const [pendingPeriod, setPendingPeriod] = useState<{
    mes: number;
    ano: number;
  } | null>(null);
  const [selectingPeriod, setSelectingPeriod] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const [status, periods] = await Promise.all([
      periodApi.getStatus(),
      periodApi.listAvailable(),
    ]);
    setPeriodsNeedingClose(status.periodsNeedingClose);
    setAvailable(periods);
    return status.periodsNeedingClose;
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadStatus()
      .catch(() => {
        if (!alive) return;
        setAvailable([]);
        setPeriodsNeedingClose([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [loadStatus]);

  const sortedAvailable = useMemo(
    () =>
      [...available].sort(
        (a, b) => a.ano * 100 + a.mes - (b.ano * 100 + b.mes),
      ),
    [available],
  );

  const navigateTo = useCallback(
    async (mes: number, ano: number) => {
      await setActivePeriod(mes, ano);
      router.push(callbackURL);
    },
    [setActivePeriod, router, callbackURL],
  );

  const handleSelectPeriod = async (period: AvailablePeriod) => {
    const today = new Date();
    const periodYear = period.ano >= 100 ? period.ano : 2000 + period.ano;
    const isCurrentMonth =
      period.mes === today.getMonth() + 1 &&
      periodYear === today.getFullYear();

    // Picking the current month while a prior month is unclosed → intercept and
    // force the overdue close before continuing into the new month.
    if (isCurrentMonth && periodsNeedingClose.length > 0) {
      setPendingPeriod({ mes: period.mes, ano: period.ano });
      setClosingPeriod(periodsNeedingClose[0] ?? null);
      return;
    }

    const key = `${period.mes}-${period.ano}`;
    setSelectingPeriod(key);
    try {
      await navigateTo(period.mes, period.ano);
    } finally {
      setSelectingPeriod(null);
    }
  };

  const handleClosed = async () => {
    const remaining = await loadStatus().catch(
      () => [] as PeriodWithLabel[],
    );
    // Overdue months cleared and the user had a pending target → proceed to it.
    if (remaining.length === 0 && pendingPeriod) {
      const target = pendingPeriod;
      setPendingPeriod(null);
      setClosingPeriod(null);
      await navigateTo(target.mes, target.ano);
      return;
    }
    // Otherwise advance to the next overdue month (or back to the grid).
    setClosingPeriod(remaining[0] ?? null);
    if (remaining.length === 0) setPendingPeriod(null);
  };

  const handleDismissClosing = () => {
    setClosingPeriod(null);
    setPendingPeriod(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col justify-center px-6 py-12">
      {closingPeriod && (
        <ClosingModal
          period={closingPeriod}
          open
          onClosed={() => void handleClosed()}
          onDismiss={handleDismissClosing}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select working period</CardTitle>
          <CardDescription>
            Choose the inventory period you want to work in. All dashboards and
            movements will be scoped to this month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedAvailable.map((period) => {
              const key = `${period.mes}-${period.ano}`;
              const isSelecting = selectingPeriod === key;

              return (
                <Button
                  key={key}
                  variant="outline"
                  className="h-auto justify-between px-4 py-3"
                  disabled={isSelecting}
                  onClick={() => void handleSelectPeriod(period)}
                >
                  <span>{period.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {period.closed ? "Closed" : "Open"}
                    {isSelecting ? " · Saving..." : ""}
                  </span>
                </Button>
              );
            })}
          </div>

          {periodsNeedingClose.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              {periodsNeedingClose.length} period(s) still require closing before
              inventory can proceed normally.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
