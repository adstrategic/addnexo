import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import type { SupplierResponse } from "../schemas/SupplierSchemas";
import { SupplierRowActions } from "./SupplierRowActions";

interface SupplierMobileCardProps {
  supplier: SupplierResponse;
  onEdit: (sequence: number) => void;
  onDelete: (supplier: SupplierResponse) => void;
}

export function SupplierMobileCard({
  supplier,
  onEdit,
  onDelete,
}: SupplierMobileCardProps) {
  const location = [
    supplier.ciudad?.nombre,
    supplier.ciudad?.estado?.pais?.nombre,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Building2 className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/suppliers/${supplier.MPOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {supplier.MPDescripcion}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                NIT {supplier.MPNro}
              </p>
            </div>

            <SupplierRowActions
              sequence={supplier.MPOrgSecuencia}
              supplier={supplier}
              supplierName={supplier.MPDescripcion}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5 shrink-0" aria-hidden />
              {supplier.MPResponsable}
            </span>
            {location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {location}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {supplier.MPRetencion === "SI" ? (
              <Badge variant="secondary">Withholding</Badge>
            ) : null}
            {supplier.MPTelefono1 ? (
              <a
                href={`tel:${supplier.MPTelefono1}`}
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Phone className="size-3.5" aria-hidden />
                {supplier.MPTelefono1}
              </a>
            ) : null}
            {supplier.MPCorreo1 ? (
              <a
                href={`mailto:${supplier.MPCorreo1}`}
                className="inline-flex items-center gap-1 truncate text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{supplier.MPCorreo1}</span>
              </a>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
