"use client";

import { useEffect, useState } from "react";
import { periodoApi, type PeriodoStatus } from "@/lib/api/periodo";
import { ClosingModal } from "./closing-modal";
import { authClient } from "@/lib/auth-client";

const GUARD_KEY = "periodo_guard_check";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Silently checks once per day (per browser session) whether the previous month
 * needs to be closed. If yes, shows a full-screen overlay with the ClosingModal.
 */
export function PeriodoGuard() {
  const [status, setStatus] = useState<PeriodoStatus | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();
  const currentMember = activeOrg?.members?.find((m) => m.userId === session?.user?.id);
  const isAdmin = currentMember?.role === "admin";

  useEffect(() => {
    // Only run in the browser
    if (typeof window === "undefined") return;

    const lastCheck = localStorage.getItem(GUARD_KEY);
    const needsCheck =
      !lastCheck || Date.now() - parseInt(lastCheck, 10) > ONE_DAY_MS;

    if (!needsCheck) return;

    periodoApi
      .getStatus()
      .then(({ data }) => {
        localStorage.setItem(GUARD_KEY, String(Date.now()));
        if (data.necesitaCierre && data.periodoACerrar) {
          setStatus(data);
          setShowOverlay(true);
        }
      })
      .catch(() => {
        // Non-blocking: ignore errors in the guard
      });
  }, []);

  const handleClosed = () => {
    // After closing the month, dismiss the overlay and refresh the status
    periodoApi
      .getStatus()
      .then(({ data }) => {
        if (data.necesitaCierre && data.periodoACerrar) {
          setStatus(data);
        } else {
          setShowOverlay(false);
          setStatus(null);
        }
      })
      .catch(() => {
        setShowOverlay(false);
      });
  };

  // Admins handle month closing through the period selector flow — guard not needed for them
  if (isAdmin) return null;

  if (!showOverlay || !status?.periodoACerrar) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <ClosingModal
          status={status}
          onClosed={handleClosed}
          isAdmin={isAdmin}
          onDismiss={() => setShowOverlay(false)}
        />
      </div>
    </div>
  );
}
