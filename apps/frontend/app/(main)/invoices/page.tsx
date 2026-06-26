import { InvoicesContent } from "@/features/invoices/components/InvoicesContent";
import { Suspense } from "react";
import { LoadingComponent } from "@/components/loading-component";

export default function InvoicesPage() {
  return (
    <Suspense fallback={<LoadingComponent variant="dashboard" />}>
      <InvoicesContent />
    </Suspense>
  );
}
