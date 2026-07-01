"use client";

import { Building2, Mail, Shield, UserCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getRoleLabel } from "@/lib/role-labels";
import { InviteActions } from "./_components/invite-actions";

type PublicInviteInfo = {
  id: string;
  email: string;
  organizationName: string;
  role: string;
  inviterName: string | null;
  expiresAt: string;
};

type Invitation = {
  id: string;
  organizationId: string;
  organizationName?: string;
  role?: string;
  email?: string;
};

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  // Single effect with AbortController so:
  // - Only one code path runs at a time (no race between logged-out and logged-in branches).
  // - Cleanup aborts any in-flight fetch when the effect re-runs or the component unmounts,
  //   preventing stale callbacks from calling router.replace on an old render.
  useEffect(() => {
    if (sessionPending || !id) return;

    const controller = new AbortController();

    if (!session) {
      // Not logged in: fetch public invite info, then redirect to sign-in with email pre-filled.
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

      fetch(`${apiBase}/api/v1/public/invitations/${id}`, {
        method: "GET",
        signal: controller.signal,
      })
        .then(async (res) => {
          if (controller.signal.aborted) return;
          if (!res.ok) {
            router.replace("/");
            return;
          }
          const data: PublicInviteInfo = await res.json();
          if (controller.signal.aborted) return;
          const target = `/invite/${id}`;
          const url = `/sign-in?redirect=${encodeURIComponent(target)}&tab=sign-up&email=${encodeURIComponent(data.email)}`;
          router.replace(url);
        })
        .catch((err: unknown) => {
          if ((err as { name?: string })?.name === "AbortError") return;
          router.replace("/sign-in");
        });
    } else {
      // Logged in: fetch the invitation via Better Auth.
      authClient.organization
        .getInvitation({ query: { id } })
        .then((res) => {
          if (controller.signal.aborted) return;
          if (res.error || !res.data) {
            router.replace("/");
            return;
          }
          setInvitation(res.data as Invitation);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          router.replace("/");
        });
    }

    return () => controller.abort();
  }, [sessionPending, session, id, router]);

  const roleLabel = getRoleLabel(invitation?.role);

  // Show loading for every state that isn't "invitation card ready":
  // session pending, redirecting to auth, invite fetch in-flight, or invite not found (redirecting away).
  if (!invitation) {
    return <InviteLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <UserCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            You have been invited
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review the details below and decide whether to join.
          </p>
        </div>

        {/* Invitation card */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* Organization row */}
          <div className="flex items-start gap-3 px-6 py-5 border-b">
            <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Organization
              </p>
              <p className="text-base font-semibold text-foreground">
                {invitation.organizationName ?? "—"}
              </p>
            </div>
          </div>

          {/* Role row */}
          <div className="flex items-start gap-3 px-6 py-5 border-b">
            <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Your role
              </p>
              <p className="text-base font-semibold text-foreground">
                {roleLabel.name}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {roleLabel.description}
              </p>
            </div>
          </div>

          {/* Email row */}
          {invitation.email && (
            <div className="flex items-start gap-3 px-6 py-5 border-b">
              <div className="shrink-0 mt-0.5 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                  Invited email
                </p>
                <p className="text-base font-semibold text-foreground">
                  {invitation.email}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 py-5">
            <InviteActions invitation={invitation} />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          This invitation link is single-use and will expire after 48 hours.
        </p>
      </div>
    </div>
  );
}

function InviteLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4 animate-pulse">
          <UserCheck className="w-7 h-7 text-primary" />
        </div>
        <p className="text-muted-foreground text-sm">Loading invitation…</p>
      </div>
    </div>
  );
}
