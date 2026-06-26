import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import type { BankResponse } from "../schemas/BankSchema";
import { BankRowActions } from "./BankRowActions";

interface BankMobileCardProps {
  bank: BankResponse;
  onEdit: (sequence: number) => void;
  onDelete: (sequence: number, nombre: string) => void;
}

export function BankMobileCard({
  bank,
  onEdit,
  onDelete,
}: BankMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Building2 className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground">{bank.BNombre}</p>
            <BankRowActions
              bank={bank}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
