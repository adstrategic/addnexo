"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { OrganizationSelect } from "./_components/organization-select";
import { CreateOrganizationButton } from "./_components/create-organization-button";
import { OrganizationTabs } from "./_components/organization-tabs";

export default function OrganizationsPage() {
  const { data: session, isPending } = authClient.useSession();

  if (!isPending && !session) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto my-6 px-4">
      <Link
        href="/"
        className="inline-flex items-center mb-6 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4 mr-2" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8 gap-2">
        <OrganizationSelect />
        <CreateOrganizationButton />
      </div>

      <OrganizationTabs />
    </div>
  );
}
