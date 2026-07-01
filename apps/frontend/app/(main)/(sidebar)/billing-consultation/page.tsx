import { Suspense } from "react";

import LoadingComponent from "@/components/loading-component";
import { BillingContent } from "@/features/billing-dashboard";

export default function BillingConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
