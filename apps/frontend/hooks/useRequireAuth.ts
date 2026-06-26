"use client";

import { redirect } from "next/navigation";
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

  const activeOrgId = session?.session?.activeOrganizationId ?? null;

  if (!sessionPending && !session) {
    redirect("/sign-in");
  }

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

  if (activeOrgId == null) {
    redirect("/organizations");
  }

  if (activeOrganizationPending) {
    return { ready: false };
  }

  if (activeOrganization == null) {
    redirect("/organizations");
  }

  return {
    ready: true,
    session,
    activeOrganization,
  };
}
