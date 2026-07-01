"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";

import { ClosingModal } from "@/components/period/ClosingModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  periodApi,
  type AvailablePeriod,
  type PeriodWithLabel,
} from "@/lib/api/period";
import { usePeriod } from "@/lib/context/period-context";
import { cn } from "@/lib/utils";

function displayYear(ano: number): number {
  return ano >= 100 ? ano : 2000 + ano;
}

function getMonthName(mes: number): string {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(2000, mes - 1, 1),
  );
}

function isCurrentMonth(period: AvailablePeriod): boolean {
  const today = new Date();
  return (
    period.mes === today.getMonth() + 1 &&
    displayYear(period.ano) === today.getFullYear()
  );
}

function groupByYear(
  periods: AvailablePeriod[],
): { year: number; periods: AvailablePeriod[] }[] {
  const groups = new Map<number, AvailablePeriod[]>();

  for (const period of periods) {
    const year = displayYear(period.ano);
    const existing = groups.get(year) ?? [];
    existing.push(period);
    groups.set(year, existing);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, yearPeriods]) => ({ year, periods: yearPeriods }));
}

function PeriodSelectSkeleton() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC] to-[#B8F0F3]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#1ECAD3]/10 blur-3xl"
      />
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-4">
          <Skeleton className="size-16 rounded-2xl" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
          <Skeleton className="mb-6 h-5 w-24" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type PeriodCardProps = {
  period: AvailablePeriod;
  isSelecting: boolean;
  onSelect: (period: AvailablePeriod) => void;
};

function PeriodCard({ period, isSelecting, onSelect }: PeriodCardProps) {
  const current = isCurrentMonth(period);
  const month = getMonthName(period.mes);
  const year = displayYear(period.ano);

  return (
    <button
      type="button"
      disabled={isSelecting}
      onClick={() => void onSelect(period)}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-60",
        period.closed
          ? "border-l-4 border-l-muted-foreground/30"
          : "border-l-4 border-l-primary",
        current && "ring-1 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-foreground">
            {month}
          </p>
          <p className="text-sm text-muted-foreground">{year}</p>
        </div>
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {current ? (
          <Badge
            variant="secondary"
            className="border border-primary/20 bg-primary/10 text-[#0F766E]"
          >
            Current
          </Badge>
        ) : null}
        <Badge
          variant={period.closed ? "outline" : "secondary"}
          className={cn(
            period.closed
              ? "text-muted-foreground"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
          )}
        >
          {period.closed ? (
            <Lock aria-hidden className="size-3" />
          ) : (
            <Unlock aria-hidden className="size-3" />
          )}
          {period.closed ? "Closed" : "Open"}
        </Badge>
        {isSelecting ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 aria-hidden className="size-3 animate-spin" />
            Saving
          </span>
        ) : null}
      </div>
    </button>
  );
}

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

  const groupedPeriods = useMemo(
    () => groupByYear(sortedAvailable),
    [sortedAvailable],
  );

  const navigateTo = useCallback(
    async (mes: number, ano: number) => {
      await setActivePeriod(mes, ano);
      router.push(callbackURL);
    },
    [setActivePeriod, router, callbackURL],
  );

  const handleSelectPeriod = async (period: AvailablePeriod) => {
    const periodYear = displayYear(period.ano);
    const today = new Date();
    const isCurrent =
      period.mes === today.getMonth() + 1 && periodYear === today.getFullYear();

    if (isCurrent && periodsNeedingClose.length > 0) {
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
    const remaining = await loadStatus().catch(() => [] as PeriodWithLabel[]);
    if (remaining.length === 0 && pendingPeriod) {
      const target = pendingPeriod;
      setPendingPeriod(null);
      setClosingPeriod(null);
      await navigateTo(target.mes, target.ano);
      return;
    }
    setClosingPeriod(remaining[0] ?? null);
    if (remaining.length === 0) setPendingPeriod(null);
  };

  const handleDismissClosing = () => {
    setClosingPeriod(null);
    setPendingPeriod(null);
  };

  if (loading) {
    return <PeriodSelectSkeleton />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F8FAFC] to-[#B8F0F3]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#1ECAD3]/10 blur-3xl motion-safe:animate-pulse"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 size-80 rounded-full bg-[#1ECAD3]/5 blur-3xl"
      />

      {closingPeriod ? (
        <ClosingModal
          period={closingPeriod}
          open
          onClosed={() => void handleClosed()}
          onDismiss={handleDismissClosing}
        />
      ) : null}

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-4 py-12">
        <header className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1ECAD3]/20 to-[#1ECAD3]/5 ring-1 ring-[#1ECAD3]/20">
            <CalendarDays aria-hidden className="size-8 text-[#0D9488]" />
          </div>
          <div className="space-y-2">
            <Badge
              variant="secondary"
              className="border border-[#1ECAD3]/20 bg-[#1ECAD3]/10 text-[#0F766E]"
            >
              Inventory period
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Select working period
            </h1>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Choose the month you want to work in. Dashboards, movements, and
              reports will be scoped to this period.
            </p>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-sm md:p-8">
          {periodsNeedingClose.length > 0 ? (
            <Alert className="mb-6 border-amber-200/80 bg-amber-50/80 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertTriangle aria-hidden />
              <AlertTitle>Closing required</AlertTitle>
              <AlertDescription>
                {periodsNeedingClose.length} period
                {periodsNeedingClose.length === 1 ? "" : "s"} still need closing
                before inventory can proceed normally.
              </AlertDescription>
            </Alert>
          ) : null}

          {sortedAvailable.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <CalendarDays
                  aria-hidden
                  className="size-6 text-muted-foreground"
                />
              </div>
              <p className="font-medium text-foreground">
                No periods available
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                There are no inventory periods to select right now. Contact your
                administrator if this looks wrong.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedPeriods.map(({ year, periods }) => (
                <section key={year} aria-labelledby={`year-${year}`}>
                  <h2
                    id={`year-${year}`}
                    className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {year}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {periods.map((period) => {
                      const key = `${period.mes}-${period.ano}`;
                      return (
                        <PeriodCard
                          key={key}
                          period={period}
                          isSelecting={selectingPeriod === key}
                          onSelect={handleSelectPeriod}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
