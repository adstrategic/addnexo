import { LoadingComponent } from "@/components/loading-component";
import { GroupDetails } from "@/features/inventory-groups";
import { hasClientPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ secuencia: string }>;
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { secuencia } = await params;
  const sequenceParsed = Number(secuencia);

  const hasPermission = hasClientPermissions("admin", "organization", [
    "read",
    "create",
    "update",
    "delete",
  ]);

  if (!hasPermission) {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <GroupDetails groupSequence={sequenceParsed} />
    </Suspense>
  );
}
