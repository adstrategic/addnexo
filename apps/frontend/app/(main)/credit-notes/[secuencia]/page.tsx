import { CreditNoteDetail } from "@/features/credit-notes";
import { notFound } from "next/navigation";

interface CreditNotePageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function CreditNotePage({ params }: CreditNotePageProps) {
  const { secuencia } = await params;
  if (!secuencia) {
    notFound();
  }

  return <CreditNoteDetail creditNoteSequence={secuencia} />;
}
