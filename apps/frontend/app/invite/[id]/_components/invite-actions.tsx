"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type Invitation = {
  id: string;
  organizationId: string;
  organizationName?: string;
  role?: string;
  email?: string;
};

export function InviteActions({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  function acceptInvite() {
    setAccepting(true);
    authClient.organization.acceptInvitation(
      { invitationId: invitation.id },
      {
        onSuccess: async () => {
          await authClient.organization.setActive({
            organizationId: invitation.organizationId,
          });
          router.replace("/");
        },
        onError: (ctx) => {
          const message =
            (ctx as { error?: { message?: string } })?.error?.message ?? "";

          if (
            message.toLowerCase().includes("already") ||
            message.toLowerCase().includes("member")
          ) {
            void authClient.organization
              .setActive({ organizationId: invitation.organizationId })
              .then(() => router.replace("/"));
            return;
          }

          if (
            message.toLowerCase().includes("email") ||
            message.toLowerCase().includes("different")
          ) {
            toast.error(
              "This invitation was sent to a different email address. Please sign in with the correct account.",
            );
          } else {
            toast.error(
              message || "Failed to accept invitation. Please try again.",
            );
          }
          setAccepting(false);
        },
      },
    );
  }

  function rejectInvite() {
    setRejecting(true);
    authClient.organization.rejectInvitation(
      { invitationId: invitation.id },
      {
        onSuccess: () => {
          toast.success("Invitation declined.");
          router.replace("/");
        },
        onError: (ctx) => {
          toast.error(
            (ctx as { error?: { message?: string } })?.error?.message ||
              "Failed to decline invitation",
          );
          setRejecting(false);
        },
      },
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={acceptInvite}
        disabled={accepting || rejecting}
        className="flex-1 cursor-pointer transition-opacity duration-150"
      >
        {accepting ? "Accepting…" : "Accept invitation"}
      </Button>
      <Button
        variant="outline"
        onClick={rejectInvite}
        disabled={accepting || rejecting}
        className="flex-1 cursor-pointer transition-colors duration-150"
      >
        {rejecting ? "Declining…" : "Decline"}
      </Button>
    </div>
  );
}
