"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { MembersTab } from "./members-tab";
import { InvitesTab } from "./invites-tab";

export function OrganizationTabs() {
  const { data: activeOrganization } = authClient.useActiveOrganization();

  return (
    <Card>
      {activeOrganization ? (
        <Tabs defaultValue="members" className="w-full">
          <CardContent className="pt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
              <MembersTab />
            </TabsContent>
            <TabsContent value="invitations">
              <InvitesTab />
            </TabsContent>
          </CardContent>
        </Tabs>
      ) : (
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Select or create an organization to manage members and invitations.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
