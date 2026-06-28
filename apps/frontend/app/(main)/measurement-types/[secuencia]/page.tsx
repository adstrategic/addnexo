import { LoadingComponent } from "@/components/loading-component";
import { UnitDetails } from "@/features/measurement-types";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ secuencia: string }>;
}

export default async function UnitDetailPage({ params }: PageProps) {
  const { secuencia } = await params;
  const sequenceParsed = Number(secuencia);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <UnitDetails unitSequence={sequenceParsed} />
    </Suspense>
  );
}
