"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export type UseRequireAuthOptions = {
  requireOrg?: boolean;
};

type Session = NonNullable<ReturnType<typeof authClient.useSession>["data"]>;
type ActiveOrganization = NonNullable<
  ReturnType<typeof authClient.useActiveOrganization>["data"]
>;

export type UseRequireAuthResult =
  | {
      ready: true;
      session: Session;
      activeOrganization?: ActiveOrganization;
      role?: string;
    }
  | { ready: false };

export function useRequireAuth(
  options: UseRequireAuthOptions = {},
): UseRequireAuthResult {
  const { requireOrg = false } = options;
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const {
    data: activeOrganization,
    isPending: activeOrganizationPending,
  } = authClient.useActiveOrganization();
  const router = useRouter();

  const activeOrgId = session?.session?.activeOrganizationId ?? null;

  // All navigation happens in an effect — never during render — to avoid
  // React reconciliation loops caused by redirect() throwing mid-render.
  useEffect(() => {
    if (sessionPending) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }
    if (!requireOrg) return;
    if (activeOrgId == null) {
      router.replace("/organizations");
      return;
    }
    if (!activeOrganizationPending && activeOrganization == null) {
      router.replace("/organizations");
    }
  }, [
    sessionPending,
    session,
    requireOrg,
    activeOrgId,
    activeOrganizationPending,
    activeOrganization,
    router,
  ]);

  // Synchronous return: never redirect during render, just signal not ready.
  if (sessionPending || !session) {
    return { ready: false };
  }

  if (!requireOrg) {
    return {
      ready: true,
      session,
      activeOrganization: undefined,
    };
  }

  if (activeOrgId == null || activeOrganizationPending || activeOrganization == null) {
    return { ready: false };
  }

  return {
    ready: true,
    session,
    activeOrganization,
  };
}
