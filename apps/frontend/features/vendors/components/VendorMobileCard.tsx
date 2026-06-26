import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, UserRound } from "lucide-react";
import type { VendorResponse } from "../schemas/VendorSchema";
import { VendorRowActions } from "./VendorRowActions";

interface VendorMobileCardProps {
  vendor: VendorResponse;
  onEdit: (sequence: number) => void;
  onDelete: (id: number, description: string) => void;
}

export function VendorMobileCard({
  vendor,
  onEdit,
  onDelete,
}: VendorMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <UserRound className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/vendors/${vendor.VOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {vendor.VNombre}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                NIT {vendor.VNitCedula}
              </p>
            </div>

            <VendorRowActions
              vendor={vendor}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {vendor.VTelefono ? (
              <a
                href={`tel:${vendor.VTelefono}`}
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Phone className="size-3.5" aria-hidden />
                {vendor.VTelefono}
              </a>
            ) : null}
            {vendor.VCorreo ? (
              <a
                href={`mailto:${vendor.VCorreo}`}
                className="inline-flex items-center gap-1 truncate text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{vendor.VCorreo}</span>
              </a>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
