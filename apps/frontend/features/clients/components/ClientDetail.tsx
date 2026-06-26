"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClientBySequence } from "../hooks/useClients";
import { useClientManager } from "../hooks/useClientFormManager";
import { useClientDelete } from "../hooks/useClientDelete";
import { ClientFormModal } from "../forms/ClientFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  ClientDetailsView,
  formatCurrency,
  renderContactValue,
} from "./ClientDetailsView";

interface ClientDetailsProps {
  clientSequence: number;
}

export function ClientDetails({ clientSequence }: ClientDetailsProps) {
  const router = useRouter();
  const {
    data: client,
    isLoading,
    error,
  } = useClientBySequence(clientSequence, true);

  const clientManager = useClientManager();
  const clientDelete = useClientDelete({
    onAfterDelete: () => router.push("/clients"),
  });

  const handleEdit = () => {
    if (client) {
      clientManager.openEdit(client.COrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (client) {
      clientDelete.openDeleteModal(
        client.CId,
        client.CRazonSocial,
        client.COrgSecuencia,
      );
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Client" />
      </div>
    );
  }

  if (!isLoading && !client) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <Building2 className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Client not found</h2>
          <p className="text-sm text-muted-foreground">
            The client you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/clients">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to clients
          </Link>
        </Button>
      </div>
    );
  }

  const sections = client
    ? [
        {
          title: "General Information",
          icon: <Building2 className="size-4" aria-hidden />,
          fields: [
            {
              label: "Contact Name",
              value: client.CNombreCliente,
              icon: <User className="size-4" aria-hidden />,
            },
            {
              label: "NIT/ID",
              value: client.CNitCedula,
              icon: <CreditCard className="size-4" aria-hidden />,
            },
            {
              label: "Address",
              value: client.CDireccion,
              icon: <MapPin className="size-4" aria-hidden />,
            },
            {
              label: "Main Phone",
              value: renderContactValue(client.CTelefono1, "phone"),
              icon: <Phone className="size-4" aria-hidden />,
            },
            {
              label: "Secondary Phone",
              value: renderContactValue(client.CTelefono2, "phone"),
              icon: <Phone className="size-4" aria-hidden />,
            },
            {
              label: "Main Email",
              value: renderContactValue(client.CCorreo1, "email"),
              icon: <Mail className="size-4" aria-hidden />,
            },
            {
              label: "Secondary Email",
              value: renderContactValue(client.CCorreo2, "email"),
              icon: <Mail className="size-4" aria-hidden />,
            },
          ],
        },
        {
          title: "Location",
          icon: <MapPin className="size-4" aria-hidden />,
          fields: [
            {
              label: "City",
              value: client.ciudad?.nombre,
              icon: <MapPin className="size-4" aria-hidden />,
            },
            {
              label: "State/Province",
              value: client.ciudad?.estado?.nombre,
              icon: <MapPin className="size-4" aria-hidden />,
            },
            {
              label: "Country",
              value: client.ciudad?.estado?.pais?.nombre,
              icon: <MapPin className="size-4" aria-hidden />,
            },
          ],
        },
        {
          title: "Business Terms",
          icon: <FileText className="size-4" aria-hidden />,
          fields: [
            {
              label: "Days to Invoice Due",
              value: `${client.CDiasParaVencerFactura} days`,
              icon: <Calendar className="size-4" aria-hidden />,
            },
            {
              label: "Reminder Days (Post Due)",
              value: `${client.CRecordatorioPostVencido} days`,
              icon: <Calendar className="size-4" aria-hidden />,
            },
            {
              label: "Authorized Credit Limit",
              value: formatCurrency(client.CCupoAutorizado),
              icon: <DollarSign className="size-4" aria-hidden />,
            },
            {
              label: "Current Balance",
              value: formatCurrency(client.CAbonos),
              icon: <DollarSign className="size-4" aria-hidden />,
            },
            {
              label: "Available Credit",
              value: formatCurrency(client.CCupoAutorizado - client.CAbonos),
              icon: <DollarSign className="size-4" aria-hidden />,
            },
          ],
        },
        ...(client.vendedor
          ? [
              {
                title: "Assigned Vendor",
                icon: <User className="size-4" aria-hidden />,
                fields: [
                  {
                    label: "Vendor Name",
                    value: client.vendedor.VNombre,
                    icon: <User className="size-4" aria-hidden />,
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  const quickActions = [
    {
      label: "View Invoices",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        if (client?.CRazonSocial) {
          router.push(
            `/invoices?search=${encodeURIComponent(client.CRazonSocial)}`,
          );
        }
      },
    },
    {
      label: "View Orders",
      icon: <Building2 className="size-5" aria-hidden />,
      onClick: () => {
        if (client?.CRazonSocial) {
          router.push(
            `/dispatch-orders?search=${encodeURIComponent(client.CRazonSocial)}`,
          );
        }
      },
    },
  ];

  return (
    <>
      <ClientDetailsView
        title={client?.CRazonSocial ?? ""}
        subtitle={client ? `Contact: ${client.CNombreCliente}` : undefined}
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      />

      <ClientFormModal
        isOpen={clientManager.isOpen}
        onClose={clientManager.close}
        mode={clientManager.mode}
        initialData={clientManager.client}
        form={clientManager.form}
        onSubmit={clientManager.onSubmit}
        isLoading={clientManager.isMutating}
        isLoadingClient={clientManager.isLoadingClient}
        clientError={clientManager.clientError}
      />

      <EntityDeleteModal
        isOpen={clientDelete.isDeleteModalOpen}
        onClose={clientDelete.closeDeleteModal}
        onConfirm={clientDelete.handleDeleteConfirm}
        entity="client"
        entityName={clientDelete.clienteAEliminar?.descripcion ?? ""}
        isDeleting={clientDelete.isDeleting}
      />
    </>
  );
}
