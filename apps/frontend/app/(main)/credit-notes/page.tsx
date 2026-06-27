import { CreditNoteContent } from "@/features/credit-notes";
import { Suspense } from "react";
import { LoadingComponent } from "@/components/loading-component";

export default function CreditNotesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <LoadingComponent variant="dashboard" rows={8} />
        </div>
      }
    >
      <CreditNoteContent />
    </Suspense>
  );
}
