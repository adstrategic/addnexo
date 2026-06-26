import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Package, Ruler } from "lucide-react";
import type { Producto } from "../types/server-types";
import { CatalogRowActions } from "./CatalogRowActions";

interface CatalogMobileCardProps {
  product: Producto;
  onEdit: (sequence: number) => void;
  onDelete: (id: number, description: string) => void;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function CatalogMobileCard({
  product,
  onEdit,
  onDelete,
}: CatalogMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Package className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/catalog/${product.CKOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {product.CKDescripcion}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {product.grupo.GNro} - {product.grupo.GDescripcion} · Code{" "}
                {product.CKCodigo}
              </p>
            </div>

            <CatalogRowActions
              sequence={product.CKOrgSecuencia}
              product={product}
              productName={product.CKDescripcion}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Globe className="size-3.5 shrink-0" aria-hidden />
              {product.origenPais?.nombre ?? `#${product.CKOrigenId}`}
            </span>
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5 shrink-0" aria-hidden />
              {product.unidadDeMedida.UMNombre}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              Public {formatPrice(product.CKPrecioPublico)}
            </Badge>
            <Badge variant="outline">
              Sale {formatPrice(product.CKPrecioVenta1)}
            </Badge>
            <Badge variant="outline">{product.CKIva}% VAT</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
