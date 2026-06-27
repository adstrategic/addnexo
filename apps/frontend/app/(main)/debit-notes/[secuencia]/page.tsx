import { DebitNoteDetail } from "@/features/debit-notes";
import { notFound } from "next/navigation";

interface DebitNotePageProps {
  params: Promise<{
    secuencia: string;
  }>;
}

export default async function DebitNotePage({ params }: DebitNotePageProps) {
  const { secuencia } = await params;
  if (!secuencia) {
    notFound();
  }

  return <DebitNoteDetail debitNoteSequence={secuencia} />;
}
