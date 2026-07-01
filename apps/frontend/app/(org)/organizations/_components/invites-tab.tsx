"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CreateInviteButton } from "./create-invite-button";

export function InvitesTab() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const pendingInvites =
    activeOrganization?.invitations?.filter(
      (invite) => invite.status === "pending",
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateInviteButton />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingInvites.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-8"
              >
                No pending invitations.
              </TableCell>
            </TableRow>
          ) : (
            pendingInvites.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>{invitation.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{invitation.role}</Badge>
                </TableCell>
                <TableCell>
                  {invitation.expiresAt instanceof Date
                    ? invitation.expiresAt.toLocaleDateString()
                    : new Date(invitation.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      authClient.organization.cancelInvitation({
                        invitationId: invitation.id,
                      })
                    }
                  >
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
