import { Suspense } from "react";
import { DispatchOrderForm } from "@/features/dispatch-orders";
import LoadingComponent from "@/components/loading-component";

interface EmitDispatchOrderPageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function EmitDispatchOrderPage({
  params,
}: EmitDispatchOrderPageProps) {
  const { secuencia } = await params;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <DispatchOrderForm mode="emit" sequence={Number(secuencia)} />
    </Suspense>
  );
}
