import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import type { TipoMovimiento } from "../types/server-types";
import { MovementTypeRowActions } from "./MovementTypeRowActions";
import {
  getBooleanBadgeVariant,
  getBooleanDisplayText,
  getMovementTypeDescription,
} from "../lib/utils";

interface MovementTypeMobileCardProps {
  movementType: TipoMovimiento;
  onEdit: (movementType: TipoMovimiento) => void;
  onDelete: (id: number, descripcion: string, sequence: number) => void;
}

export function MovementTypeMobileCard({
  movementType,
  onEdit,
  onDelete,
}: MovementTypeMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <ArrowLeftRight className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/movement-types/${movementType.TOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {movementType.TDescripcion}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {getMovementTypeDescription(movementType.TTipo)} · Class{" "}
                {movementType.TClase} · {movementType.TAbreviatura}
              </p>
            </div>

            <MovementTypeRowActions
              movementType={movementType}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              Affects: {getBooleanDisplayText(movementType.TAfecta)}
            </Badge>
            <Badge variant={getBooleanBadgeVariant(movementType.TFactura)}>
              Invoice: {getBooleanDisplayText(movementType.TFactura)}
            </Badge>
            <Badge variant={getBooleanBadgeVariant(movementType.TProv)}>
              Supplier: {getBooleanDisplayText(movementType.TProv)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
