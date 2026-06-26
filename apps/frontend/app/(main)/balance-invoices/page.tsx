import { Suspense } from "react";
import { BalanceInvoicesContent } from "@/features/balance-invoices/components/BalanceInvoicesContent";
import { LoadingComponent } from "@/components/loading-component";

export default function BalanceInvoices() {
  return (
    <Suspense fallback={<LoadingComponent variant="dashboard" />}>
      <BalanceInvoicesContent />
    </Suspense>
  );
}
