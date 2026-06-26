import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, User, Warehouse } from "lucide-react";
import type { AlmacenResponse } from "../schemas/almacenes.schema";
import { WarehouseRowActions } from "./WarehouseRowActions";

interface WarehouseMobileCardProps {
  warehouse: AlmacenResponse;
  onEdit: (sequence: number) => void;
  onDelete: (warehouse: AlmacenResponse) => void;
}

export function WarehouseMobileCard({
  warehouse,
  onEdit,
  onDelete,
}: WarehouseMobileCardProps) {
  const location = [
    warehouse.ciudad?.nombre,
    warehouse.ciudad?.estado?.pais?.nombre,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Warehouse className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/warehouses/${warehouse.ALOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {warehouse.ALNombre}
              </Link>
              {location ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{location}</p>
              ) : null}
            </div>

            <WarehouseRowActions
              sequence={warehouse.ALOrgSecuencia}
              warehouse={warehouse}
              warehouseName={warehouse.ALNombre}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5 shrink-0" aria-hidden />
              {warehouse.ALResponsable}
            </span>
            {warehouse.ALDireccion ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {warehouse.ALDireccion}
              </span>
            ) : null}
          </div>

          {warehouse.ALTelefono ? (
            <a
              href={`tel:${warehouse.ALTelefono}`}
              className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
            >
              <Phone className="size-3.5" aria-hidden />
              {warehouse.ALTelefono}
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
