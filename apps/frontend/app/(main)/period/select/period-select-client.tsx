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
  const [closingPeriod, setClosingPeriod] = useState<PeriodWithLabel | null>(
    null,
  );
  const [selectingPeriod, setSelectingPeriod] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const [status, periods] = await Promise.all([
      periodApi.getStatus(),
      periodApi.listAvailable(),
    ]);
    setPeriodsNeedingClose(status.periodsNeedingClose);
    setAvailable(periods);
    setClosingPeriod(status.periodsNeedingClose[0] ?? null);
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadStatus()
      .catch(() => {
        if (!alive) return;
        setAvailable([]);
        setPeriodsNeedingClose([]);
        setClosingPeriod(null);
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

  const handleClosed = async () => {
    await loadStatus();
  };

  const handleSelectPeriod = async (period: AvailablePeriod) => {
    const key = `${period.mes}-${period.ano}`;
    setSelectingPeriod(key);
    try {
      await setActivePeriod(period.mes, period.ano);
      router.push(callbackURL);
    } finally {
      setSelectingPeriod(null);
    }
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
        />
      )}

      {!closingPeriod && (
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
                {periodsNeedingClose.length} period(s) still require closing
                before inventory can proceed normally.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
