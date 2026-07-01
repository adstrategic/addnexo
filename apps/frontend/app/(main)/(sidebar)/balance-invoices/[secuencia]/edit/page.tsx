import LoadingComponent from "@/components/loading-component";
import { BalanceInvoicesForm } from "@/features/balance-invoices";
import { Suspense } from "react";

interface EditInvoicePageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const { secuencia } = await params;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <BalanceInvoicesForm mode="edit" sequence={Number(secuencia)} />
    </Suspense>
  );
}
