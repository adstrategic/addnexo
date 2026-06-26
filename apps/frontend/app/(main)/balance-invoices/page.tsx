import { Suspense } from "react";
import { BalanceInvoicesContent } from "@/features/balance-invoices";
import { LoadingComponent } from "@/components/loading-component";

export default function BalanceInvoices() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <BalanceInvoicesContent />
    </Suspense>
  );
}
