import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Mail, MapPin, Phone, User } from "lucide-react";
import type { ClienteResponse } from "../schemas/ClientSchema";
import { ClientRowActions } from "./ClientRowActions";

interface ClientMobileCardProps {
  client: ClienteResponse;
  onEdit: (sequence: number) => void;
  onDelete: (id: number, descripcion: string, sequence: number) => void;
}

export function ClientMobileCard({
  client,
  onEdit,
  onDelete,
}: ClientMobileCardProps) {
  const location = [
    client.ciudad?.nombre,
    client.ciudad?.estado?.pais?.nombre,
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
                href={`/clients/${client.COrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {client.CRazonSocial}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                NIT {client.CNitCedula}
              </p>
            </div>

            <ClientRowActions
              client={client}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="size-3.5 shrink-0" aria-hidden />
              {client.CNombreCliente}
            </span>
            {location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {location}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {client.CTelefono1 ? (
              <a
                href={`tel:${client.CTelefono1}`}
                className="inline-flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Phone className="size-3.5" aria-hidden />
                {client.CTelefono1}
              </a>
            ) : null}
            {client.CCorreo1 ? (
              <a
                href={`mailto:${client.CCorreo1}`}
                className="inline-flex items-center gap-1 truncate text-xs text-primary transition-colors hover:text-primary/80"
              >
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{client.CCorreo1}</span>
              </a>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
