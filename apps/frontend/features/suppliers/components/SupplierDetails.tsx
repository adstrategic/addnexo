"use client";

import { useSupplierBySequence } from "../hooks/useSuppliers";
import {
  EntityDetails,
  EntitySection,
  EntityField,
  EntityAction,
} from "@/components/shared/EntityDetails";
import {
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { SupplierFormModal } from "../forms/SupplierFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useSupplierFormManager } from "../hooks/useSupplierFormManager";
import { useSupplierDelete } from "../hooks/useSupplierDelete";

interface SupplierDetailsProps {
  supplierSequence: number;
}

export function SupplierDetails({ supplierSequence }: SupplierDetailsProps) {
  const {
    data: supplier,
    isLoading,
    error,
  } = useSupplierBySequence(supplierSequence, true);

  // Supplier modal hook - handles all modal logic
  const supplierModal = useSupplierFormManager();
  const supplierDelete = useSupplierDelete();

  // Open edit modal when supplier is loaded
  const handleEdit = () => {
    if (supplier) {
      supplierModal.openEdit(supplier.MPOrgSecuencia);
    }
  };

  // Open delete modal
  const handleDelete = () => {
    if (supplier) {
      supplierDelete.openDeleteModal(supplier);
    }
  };

  const handleViewInvoices = () => {
    // TODO: Implement navigation to supplier invoices
    console.log("View supplier invoices:", supplier?.MPId);
  };

  const handleViewProducts = () => {
    // TODO: Implement navigation to supplier products
    console.log("View supplier products:", supplier?.MPId);
  };

  const handleViewAddresses = () => {
    // TODO: Implement navigation to supplier addresses
    console.log("View supplier addresses:", supplier?.MPId);
  };

  // Prepare information sections
  const sections: EntitySection[] = supplier
    ? [
        {
          title: "General Information",
          icon: <Building2 className="h-5 w-5" />,
          fields: [
            {
              label: "Responsible",
              value: supplier.MPResponsable,
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Address",
              value: supplier.MPDireccion,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Main Phone",
              value: supplier.MPTelefono1,
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Main Email",
              value: supplier.MPCorreo1,
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 2",
              value: supplier.MPTelefono2,
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 2",
              value: supplier.MPCorreo2,
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Withholding",
              value: supplier.MPRetencion,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Location",
          icon: <MapPin className="h-5 w-5" />,
          fields: [
            {
              label: "City",
              value: supplier.ciudad?.nombre,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "State/Province",
              value: supplier.ciudad?.estado?.nombre,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Country",
              value: supplier.ciudad?.estado?.pais?.nombre,
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
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
      label: "View Products",
      icon: <Building2 className="h-6 w-6" />,
      onClick: handleViewProducts,
    },
    {
      label: "View Addresses",
      icon: <MapPin className="h-6 w-6" />,
      onClick: handleViewAddresses,
    },
  ];

  return (
    <>
      <EntityDetails
        title={supplier?.MPDescripcion || ""}
        subtitle={supplier ? `NIT: ${supplier.MPNro}` : ""}
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
        notFoundMessage="The supplier you are looking for does not exist or has been deleted."
        notFoundIcon={<Building2 className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Supplier Form Modal - handles edit */}
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

      {/* Delete Confirmation Modal */}
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
