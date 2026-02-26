"use client";

import { ShortcutsContent } from "@/components/shortcuts-content";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  console.log(session);

  if (!isPending && !session) {
    redirect("/sign-in");
  }

  return <ShortcutsContent />;
}
