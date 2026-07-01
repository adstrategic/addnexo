import { TicketPercent } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

export default function CostPerOrderPage() {
  return (
    <ComingSoon
      title="Cost per Order"
      section="Liquidations"
      icon={TicketPercent}
      description="Analyze and allocate costs at the order level for accurate liquidation reporting."
    />
  );
}
