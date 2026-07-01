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
import { toast } from "sonner";
import { useState } from "react";

export function MembersTab() {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const members = activeOrganization?.members ?? [];

  function removeMember(memberId: string) {
    setRemovingId(memberId);
    authClient.organization.removeMember(
      { memberIdOrEmail: memberId },
      {
        onError: (error) => {
          toast.error(
            (error as { error?: { message?: string } })?.error?.message ||
              "Failed to remove member"
          );
          setRemovingId(null);
        },
        onSuccess: () => {
          setRemovingId(null);
        },
      }
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>{member.user.name}</TableCell>
            <TableCell>{member.user.email}</TableCell>
            <TableCell>
              <Badge variant="secondary">{member.role}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {member.userId !== session?.user?.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeMember(member.id)}
                  disabled={removingId === member.id}
                >
                  {removingId === member.id ? "Removing…" : "Remove"}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
