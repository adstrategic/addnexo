import { Calculator } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

export default function LiquidationsContentPage() {
  return (
    <ComingSoon
      title="Liquidation"
      section="Liquidations"
      icon={Calculator}
      description="Process and review liquidation workflows, settlements, and final adjustments."
    />
  );
}
