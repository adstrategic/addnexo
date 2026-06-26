import { Suspense } from "react";
import { SuspenseFallback } from "@/components/loading-component";
import PeriodSelectPage from "./period-select-client";

export default function PeriodSelectRoute() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <PeriodSelectPage />
    </Suspense>
  );
}
