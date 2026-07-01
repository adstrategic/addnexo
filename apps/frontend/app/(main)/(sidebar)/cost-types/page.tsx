import { SwatchBook } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

export default function CostTypesPage() {
  return (
    <ComingSoon
      title="Costs Type"
      section="Liquidations"
      icon={SwatchBook}
      description="Define and manage cost categories used in liquidation calculations."
    />
  );
}
