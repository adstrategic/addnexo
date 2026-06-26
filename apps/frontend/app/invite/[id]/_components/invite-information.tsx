"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Invitation = {
  id: string;
  organizationId: string;
  organizationName?: string;
  role?: string;
};

export function InviteInformation({
  invitation,
}: {
  invitation: Invitation;
}) {
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
          router.push("/organizations");
        },
        onError: (error) => {
          toast.error(
            (error as { error?: { message?: string } })?.error?.message ||
              "Failed to accept invitation"
          );
          setAccepting(false);
        },
      }
    );
  }

  function rejectInvite() {
    setRejecting(true);
    authClient.organization.rejectInvitation(
      { invitationId: invitation.id },
      {
        onSuccess: () => {
          router.push("/");
        },
        onError: (error) => {
          toast.error(
            (error as { error?: { message?: string } })?.error?.message ||
              "Failed to reject invitation"
          );
          setRejecting(false);
        },
      }
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={acceptInvite}
        disabled={accepting || rejecting}
      >
        {accepting ? "Accepting…" : "Accept"}
      </Button>
      <Button
        variant="outline"
        onClick={rejectInvite}
        disabled={accepting || rejecting}
      >
        {rejecting ? "Rejecting…" : "Reject"}
      </Button>
    </div>
  );
}
