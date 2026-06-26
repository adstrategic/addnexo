"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteInformation } from "./_components/invite-information";

type Invitation = {
  id: string;
  organizationId: string;
  organizationName?: string;
  role?: string;
};

export default function InvitePage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session, isPending } = authClient.useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (isPending || !session || !id) return;
    authClient.organization
      .getInvitation({ query: { id } })
      .then((res) => {
        setHasFetched(true);
        if (res.error) {
          setFetchFailed(true);
          return;
        }
        if (res.data) {
          setInvitation(res.data as Invitation);
        } else {
          setFetchFailed(true);
        }
      })
      .catch(() => {
        setHasFetched(true);
        setFetchFailed(true);
      });
  }, [id, session, isPending]);

  if (!isPending && !session) {
    redirect("/sign-in");
  }

  if (hasFetched && fetchFailed) {
    redirect("/");
  }

  if (invitation == null) {
    return (
      <div className="container mx-auto my-6 max-w-2xl px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Loading invitation…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-6 max-w-2xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>Organization invitation</CardTitle>
          <CardDescription>
            You have been invited to join {invitation.organizationName ?? "an organization"}{" "}
            as {invitation.role ?? "a member"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteInformation invitation={invitation} />
        </CardContent>
      </Card>
    </div>
  );
}
