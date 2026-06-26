"use client";

import { useSupplierBySequence } from "../hooks/useSuppliers";
import { SupplierFormModal } from "../forms/SupplierFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useSupplierFormManager } from "../hooks/useSupplierFormManager";
import { useSupplierDelete } from "../hooks/useSupplierDelete";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  SupplierDetailsView,
  renderContactValue,
  renderRetentionBadge,
  supplierDetailIcons,
} from "./SupplierDetailsView";
import { Building2, FileText, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SupplierDetailsProps {
  supplierSequence: number;
}

export function SupplierDetails({ supplierSequence }: SupplierDetailsProps) {
  const {
    data: supplier,
    isLoading,
    error,
  } = useSupplierBySequence(supplierSequence, true);

  const supplierModal = useSupplierFormManager();
  const supplierDelete = useSupplierDelete();

  const handleEdit = () => {
    if (supplier) {
      supplierModal.openEdit(supplier.MPOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (supplier) {
      supplierDelete.openDeleteModal(supplier);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Supplier" />
      </div>
    );
  }

  if (!isLoading && !supplier) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <Building2 className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Supplier not found</h2>
          <p className="text-sm text-muted-foreground">
            The supplier you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/suppliers">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to suppliers
          </Link>
        </Button>
      </div>
    );
  }

  const sections = supplier
    ? [
        {
          title: "General Information",
          icon: supplierDetailIcons.building,
          fields: [
            {
              label: "Responsible",
              value: supplier.MPResponsable,
              icon: supplierDetailIcons.user,
            },
            {
              label: "Address",
              value: supplier.MPDireccion,
              icon: supplierDetailIcons.mapPin,
            },
            {
              label: "Main Phone",
              value: renderContactValue(supplier.MPTelefono1, "phone"),
              icon: supplierDetailIcons.phone,
            },
            {
              label: "Main Email",
              value: renderContactValue(supplier.MPCorreo1, "email"),
              icon: supplierDetailIcons.mail,
            },
            {
              label: "Phone 2",
              value: renderContactValue(supplier.MPTelefono2, "phone"),
              icon: supplierDetailIcons.phone,
            },
            {
              label: "Email 2",
              value: renderContactValue(supplier.MPCorreo2, "email"),
              icon: supplierDetailIcons.mail,
            },
            {
              label: "Withholding",
              value: renderRetentionBadge(supplier.MPRetencion),
              icon: supplierDetailIcons.file,
            },
          ],
        },
        {
          title: "Location",
          icon: supplierDetailIcons.mapPin,
          fields: [
            {
              label: "City",
              value: supplier.ciudad?.nombre,
              icon: supplierDetailIcons.mapPin,
            },
            {
              label: "State/Province",
              value: supplier.ciudad?.estado?.nombre,
              icon: supplierDetailIcons.mapPin,
            },
            {
              label: "Country",
              value: supplier.ciudad?.estado?.pais?.nombre,
              icon: supplierDetailIcons.mapPin,
            },
          ],
        },
      ]
    : [];

  const quickActions = [
    {
      label: "View Invoices",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to supplier invoices
      },
    },
    {
      label: "View Products",
      icon: <Building2 className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to supplier products
      },
    },
    {
      label: "View Addresses",
      icon: <MapPin className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to supplier addresses
      },
    },
  ];

  return (
    <>
      <SupplierDetailsView
        title={supplier?.MPDescripcion ?? ""}
        subtitle={supplier ? `NIT: ${supplier.MPNro}` : undefined}
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      />

      <SupplierFormModal
        isOpen={supplierModal.isOpen}
        onClose={supplierModal.close}
        mode={supplierModal.mode}
        form={supplierModal.form}
        initialData={supplierModal.supplier}
        onSubmit={supplierModal.onSubmit}
        isLoading={supplierModal.isMutating}
        isLoadingSupplier={supplierModal.isLoadingSupplier}
        supplierError={supplierModal.supplierError}
      />

      <EntityDeleteModal
        isOpen={supplierDelete.isDeleteModalOpen}
        onClose={supplierDelete.closeDeleteModal}
        onConfirm={supplierDelete.handleDeleteConfirm}
        entity="supplier"
        entityName={supplierDelete.supplierToDelete?.description || ""}
        isDeleting={supplierDelete.isDeleting}
      />
    </>
  );
}
