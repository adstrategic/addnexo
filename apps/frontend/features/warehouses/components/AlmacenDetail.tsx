"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, MapPin, Phone, Plus, User, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlmacenBySequence } from "../hooks/useAlmacenes";
import { useAlmacenManager } from "../hooks/useAlmacenManager";
import { useAlmacenDelete } from "../hooks/useAlmacenDelete";
import { AlmacenFormModal } from "../forms/AlmacenFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  WarehouseDetailsView,
  renderContactValue,
  warehouseDetailIcons,
} from "./WarehouseDetailsView";

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

  const handleEdit = () => {
    if (almacen) {
      almacenManager.openEdit(almacen.ALOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (almacen) {
      almacenDelete.openDeleteModal(almacen);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Warehouse" />
      </div>
    );
  }

  if (!isLoading && !almacen) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <Warehouse className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Warehouse not found</h2>
          <p className="text-sm text-muted-foreground">
            The warehouse you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/warehouses">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to warehouses
          </Link>
        </Button>
      </div>
    );
  }

  const sections = almacen
    ? [
        {
          title: "General Information",
          icon: warehouseDetailIcons.warehouse,
          fields: [
            {
              label: "Responsible",
              value: almacen.ALResponsable,
              icon: <User className="size-4" aria-hidden />,
            },
            {
              label: "Address",
              value: almacen.ALDireccion,
              icon: <MapPin className="size-4" aria-hidden />,
            },
            {
              label: "Phone",
              value: renderContactValue(almacen.ALTelefono, "phone"),
              icon: <Phone className="size-4" aria-hidden />,
            },
          ],
        },
        {
          title: "Location",
          icon: <MapPin className="size-4" aria-hidden />,
          fields: [
            {
              label: "City",
              value: almacen.ciudad?.nombre,
              icon: <MapPin className="size-4" aria-hidden />,
            },
            {
              label: "State/Province",
              value: almacen.ciudad?.estado?.nombre,
              icon: <MapPin className="size-4" aria-hidden />,
            },
            {
              label: "Country",
              value: almacen.ciudad?.estado?.pais?.nombre,
              icon: <MapPin className="size-4" aria-hidden />,
            },
          ],
        },
      ]
    : [];

  const quickActions = [
    {
      label: "View Inventory",
      icon: <Warehouse className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to warehouse inventory
      },
    },
    {
      label: "Add Inventory",
      icon: <Plus className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to inventory page with warehouse pre-selected
      },
    },
    {
      label: "View Movements",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to warehouse movements
      },
    },
    {
      label: "View Reports",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to warehouse reports
      },
    },
  ];

  return (
    <>
      <WarehouseDetailsView
        title={almacen?.ALNombre ?? ""}
        subtitle={almacen ? `Warehouse #${almacen.ALOrgSecuencia}` : undefined}
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
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
