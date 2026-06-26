"use client";

import { useClientBySequence } from "../hooks/useClients";
import { useClientManager } from "../hooks/useClientFormManager";
import { useClientDelete } from "../hooks/useClientDelete";
import { ClientFormModal } from "../forms/ClientFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ClientDetailsProps {
  clientSequence: number;
}

export function ClientDetails({ clientSequence }: ClientDetailsProps) {
  const {
    data: client,
    isLoading,
    error,
  } = useClientBySequence(clientSequence, true);

  const router = useRouter();

  // Hook para Formulario
  const clientManager = useClientManager();

  // Hook para Eliminación con redirección
  const clientDelete = useClientDelete({
    onAfterDelete: () => router.push("/clients"),
  });

  const handleViewInvoices = () => {
    if (client?.CRazonSocial) {
      router.push(
        `/invoices?search=${encodeURIComponent(client.CRazonSocial)}`,
      );
    }
  };

  const handleViewOrders = () => {
    if (client?.CRazonSocial) {
      router.push(
        `/dispatch-orders?search=${encodeURIComponent(client.CRazonSocial)}`,
      );
    }
  };

  // Prepare information sections
  const sections: EntitySection[] = client
    ? [
        {
          title: "General Information",
          icon: <Building2 className="h-5 w-5" />,
          fields: [
            {
              label: "Business Name",
              value: client.CRazonSocial,
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Contact Name",
              value: client.CNombreCliente,
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/ID",
              value: client.CNitCedula,
              icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Address",
              value: client.CDireccion,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Main Phone",
              value: client.CTelefono1.toString(),
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Secondary Phone",
              value: client.CTelefono2 ? client.CTelefono2.toString() : "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Main Email",
              value: client.CCorreo1,
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Secondary Email",
              value: client.CCorreo2 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Location",
          icon: <MapPin className="h-5 w-5" />,
          fields: [
            {
              label: "City",
              value: client.ciudad?.nombre,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "State/Province",
              value: client.ciudad?.estado?.nombre,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Country",
              value: client.ciudad?.estado?.pais?.nombre,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Business Terms",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "Days to Invoice Due",
              value: `${client.CDiasParaVencerFactura} days`,
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Reminder Days (Post Due)",
              value: `${client.CRecordatorioPostVencido} days`,
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Authorized Credit Limit",
              value: new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(client.CCupoAutorizado),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Current Balance",
              value: new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(client.CAbonos),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Available Credit",
              value: new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0,
              }).format(client.CCupoAutorizado - client.CAbonos),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        ...(client.vendedor
          ? [
              {
                title: "Assigned Vendor",
                icon: <User className="h-5 w-5" />,
                fields: [
                  {
                    label: "Vendor Name",
                    value: `${client.vendedor.VNombre}`,
                    icon: <User className="h-4 w-4 text-muted-foreground" />,
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  // Prepare quick actions
  const quickActions: EntityAction[] = [
    {
      label: "View Invoices",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewInvoices,
    },
    {
      label: "View Orders",
      icon: <Building2 className="h-6 w-6" />,
      onClick: handleViewOrders,
    },
  ];

  return (
    <>
      <EntityDetails
        title={client?.CRazonSocial || ""}
        subtitle={client ? `Contact: ${client.CNombreCliente}` : ""}
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() => client && clientManager.openEdit(client.COrgSecuencia)}
        onDelete={() =>
          client &&
          clientDelete.openDeleteModal(
            client.CId,
            client.CRazonSocial,
            client.COrgSecuencia,
          )
        }
        quickActions={quickActions}
        notFoundMessage="The client you are looking for does not exist or has been deleted."
        notFoundIcon={<User className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Client Form Modal */}
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

      {/* Delete Confirmation Modal */}
      <EntityDeleteModal
        isOpen={clientDelete.isDeleteModalOpen}
        onClose={clientDelete.closeDeleteModal}
        onConfirm={clientDelete.handleDeleteConfirm}
        entity="client"
        entityName={clientDelete.clienteAEliminar?.descripcion || ""}
        isDeleting={clientDelete.isDeleting}
      />
    </>
  );
}
