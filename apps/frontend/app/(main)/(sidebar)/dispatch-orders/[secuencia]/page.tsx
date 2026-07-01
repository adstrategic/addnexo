import { Suspense } from "react";
import { DispatchOrderDetails } from "@/features/dispatch-orders";
import LoadingComponent from "@/components/loading-component";

interface DispatchOrderDetailPageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function DispatchOrderDetailPage({
  params,
}: DispatchOrderDetailPageProps) {
  const { secuencia } = await params;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <DispatchOrderDetails dispatchOrderSequence={secuencia} />
    </Suspense>
  );
}
