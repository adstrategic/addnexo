"use client";

import { useCallback, useEffect, useState } from "react";

import { ClosingModal } from "@/components/period/ClosingModal";
import { periodApi, type PeriodWithLabel } from "@/lib/api/period";
import { usePeriod } from "@/lib/context/period-context";

const GUARD_KEY = "period_closing_guard_check";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Background guard. Once per day per browser, silently checks whether a prior
 * month still needs closing; if so, opens the (blocking) ClosingModal. The modal
 * shows the Close action to admins and a contact-admin message to everyone else.
 * Non-blocking on error. Mounted globally inside the protected layout.
 */
export function PeriodClosingGuard() {
  const { refreshPeriod } = usePeriod();
  const [pending, setPending] = useState<PeriodWithLabel[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastCheck = localStorage.getItem(GUARD_KEY);
    const due =
      !lastCheck || Date.now() - parseInt(lastCheck, 10) > ONE_DAY_MS;
    if (!due) return;

    periodApi
      .getStatus()
      .then((status) => {
        localStorage.setItem(GUARD_KEY, String(Date.now()));
        if (status.periodsNeedingClose.length > 0) {
          setPending(status.periodsNeedingClose);
          setOpen(true);
        }
      })
      .catch(() => {
        // Non-blocking: ignore errors in the guard.
      });
  }, []);

  const handleClosed = useCallback(async () => {
    // A close creates the next period — refresh the active-period label.
    await refreshPeriod();
    try {
      const status = await periodApi.getStatus();
      if (status.periodsNeedingClose.length > 0) {
        setPending(status.periodsNeedingClose);
      } else {
        setPending([]);
        setOpen(false);
      }
    } catch {
      setOpen(false);
    }
  }, [refreshPeriod]);

  const current = pending[0];
  if (!open || !current) return null;

  return (
    <ClosingModal
      period={current}
      open={open}
      onClosed={() => void handleClosed()}
    />
  );
}
