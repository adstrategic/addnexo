import { LoadingComponent } from "@/components/loading-component";
import { ClientDetails } from "@/features/clients";
import { Suspense } from "react";

interface ClientPageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
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
      <ClientDetails clientSequence={sequenceParsed} />
    </Suspense>
  );
}
