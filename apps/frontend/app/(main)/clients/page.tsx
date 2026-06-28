import LoadingComponent from "@/components/loading-component";
import { ClientsContent } from "@/features/clients";
import { Suspense } from "react";

export default function ClientsPage() {

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <ClientsContent />
    </Suspense>
  );
}
