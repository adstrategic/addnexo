import { LoadingComponent } from "@/components/loading-component";
import { SupplierDetails } from "@/features/suppliers";
import { Suspense } from "react";

interface SupplierPageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function SupplierPage({ params }: SupplierPageProps) {
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
      <SupplierDetails supplierSequence={sequenceParsed} />
    </Suspense>
  );
}
