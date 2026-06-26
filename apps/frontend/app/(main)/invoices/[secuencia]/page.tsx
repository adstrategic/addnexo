import { InvoicesDetails } from "@/features/invoices";

interface InvoiceDetailPageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { secuencia } = await params;

  return <InvoicesDetails invoiceSequence={secuencia} />;
}
