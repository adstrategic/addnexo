import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Ruler } from "lucide-react";
import type { UnitResponse } from "../schemas/units.schema";
import { UnitRowActions } from "./UnitRowActions";

interface UnitMobileCardProps {
  unit: UnitResponse;
  onEdit: (sequence: number) => void;
  onDelete: (unit: UnitResponse) => void;
}

export function UnitMobileCard({ unit, onEdit, onDelete }: UnitMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Ruler className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/measurement-types/${unit.UMOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {unit.UMNombre}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {unit.UMDescripcion}
              </p>
            </div>

            <UnitRowActions
              sequence={unit.UMOrgSecuencia}
              unit={unit}
              unitName={unit.UMNombre}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="size-3.5 shrink-0" aria-hidden />
            {unit.UMDescripcion}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
