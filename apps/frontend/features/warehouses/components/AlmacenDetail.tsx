"use client";

import { useAlmacenBySequence } from "../hooks/useAlmacenes";
import { useAlmacenManager } from "../hooks/useAlmacenManager";
import { useAlmacenDelete } from "../hooks/useAlmacenDelete";
import { AlmacenFormModal } from "../forms/AlmacenFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import { Warehouse, FileText, MapPin, Phone, User, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AlmacenDetailProps {
  almacenSequence: number;
}

export function AlmacenDetail({ almacenSequence }: AlmacenDetailProps) {
  const router = useRouter();
  const {
    data: almacen,
    isLoading,
    error,
  } = useAlmacenBySequence(almacenSequence, !!almacenSequence);

  const almacenManager = useAlmacenManager();
  const almacenDelete = useAlmacenDelete({
    onAfterDelete: () => router.push("/warehouses"),
  });

  const handleViewInventory = () => {
    // TODO: Implement navigation to warehouse inventory
  };

  const handleViewMovements = () => {
    // TODO: Implement navigation to warehouse movements
  };

  const handleViewReports = () => {
    // TODO: Implement navigation to warehouse reports
  };

  const handleAddInventory = () => {
    // TODO: Navigate to inventory page with warehouse pre-selected
  };

  const sections: EntitySection[] = almacen
    ? [
        {
          title: "General Information",
          icon: <Warehouse className="h-5 w-5" />,
          fields: [
            {
              label: "Name",
              value: almacen.ALNombre,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Responsible",
              value: almacen.ALResponsable,
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Address",
              value: almacen.ALDireccion,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone",
              value: almacen.ALTelefono || "Not specified",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
      ]
    : [];

  const quickActions: EntityAction[] = [
    {
      label: "View Inventory",
      icon: <Warehouse className="h-6 w-6" />,
      onClick: handleViewInventory,
    },
    {
      label: "Add Inventory",
      icon: <Plus className="h-6 w-6" />,
      onClick: handleAddInventory,
    },
    {
      label: "View Movements",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewMovements,
    },
    {
      label: "View Reports",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewReports,
    },
  ];

  return (
    <>
      <EntityDetails
        title={almacen?.ALNombre ?? ""}
        subtitle={almacen ? `Warehouse #${almacen.ALOrgSecuencia}` : ""}
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() =>
          almacen && almacenManager.openEdit(almacen.ALOrgSecuencia)
        }
        onDelete={() => almacen && almacenDelete.openDeleteModal(almacen)}
        quickActions={quickActions}
        notFoundMessage="The warehouse you are looking for does not exist or has been deleted."
        notFoundIcon={<Warehouse className="h-12 w-12 text-muted-foreground" />}
      />

      <AlmacenFormModal
        isOpen={almacenManager.isOpen}
        onClose={almacenManager.close}
        mode={almacenManager.mode}
        initialData={almacenManager.almacen}
        form={almacenManager.form}
        onSubmit={almacenManager.onSubmit}
        isLoading={almacenManager.isMutating}
        isLoadingAlmacen={almacenManager.isLoadingAlmacen}
        almacenError={almacenManager.almacenError}
      />

      <EntityDeleteModal
        isOpen={almacenDelete.isDeleteModalOpen}
        onClose={almacenDelete.closeDeleteModal}
        onConfirm={almacenDelete.handleDeleteConfirm}
        entity="warehouse"
        entityName={
          almacen?.ALNombre ?? almacenDelete.almacenToDelete?.description ?? ""
        }
        isDeleting={almacenDelete.isDeleting}
      />
    </>
  );
}
