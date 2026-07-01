import { CreditCard } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";

export default function AccountsPayablePage() {
  return (
    <ComingSoon
      title="Accounts Payable"
      section="Orders"
      icon={CreditCard}
      description="Track vendor payments, outstanding balances, and payment schedules in one place."
    />
  );
}
