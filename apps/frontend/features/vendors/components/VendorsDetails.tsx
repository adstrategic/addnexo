"use client";

// Next.js
import { useRouter } from "next/navigation";

// Icons
import {
  User,
  Phone,
  Mail,
  FileText,
  CreditCard,
} from "lucide-react";

// Hooks
import { useVendorBySequence } from "../hooks/useVendors";
import { useVendorManager } from "../hooks/useVendorManager";
import { useVendorDelete } from "../hooks/useVendorDelete";

// Components
import { VendedorFormModal } from "../forms/VendorFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";

interface VendorDetailsProps {
  vendorSequence: number;
}

export function VendorDetails({ vendorSequence }: VendorDetailsProps) {
  const {
    data: vendor,
    isLoading,
    error,
  } = useVendorBySequence(vendorSequence, !!vendorSequence);

  const vendorManager = useVendorManager();
  const router = useRouter();

  const vendorDelete = useVendorDelete({
    onAfterDelete: () => router.push("/vendors"),
  });

  const handleViewInvoices = () => {
    if (vendor?.VNombre) {
      router.push(`/invoices?search=${encodeURIComponent(vendor.VNombre)}`);
    }
  };

  const handleViewOrders = () => {
    if (vendor?.VNombre) {
      router.push(
        `/dispatch-orders?search=${encodeURIComponent(vendor.VNombre)}`,
      );
    }
  };

  const sections: EntitySection[] = vendor
    ? [
        {
          title: "General Information",
          icon: <User className="h-5 w-5" />,
          fields: [
            {
              label: "Name",
              value: vendor.VNombre,
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/Cedula",
              value: vendor.VNitCedula,
              icon: <CreditCard className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone",
              value: vendor.VTelefono,
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email",
              value: vendor.VCorreo,
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Organization Sequence",
              value: vendor.VOrgSecuencia.toString(),
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
      ]
    : [];

  const quickActions: EntityAction[] = [
    {
      label: "View Invoices",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewInvoices,
    },
    {
      label: "View Orders",
      icon: <User className="h-6 w-6" />,
      onClick: handleViewOrders,
    },
  ];

  return (
    <>
      <EntityDetails
        title={vendor?.VNombre || ""}
        subtitle={vendor ? `NIT: ${vendor.VNitCedula}` : ""}
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() =>
          vendor && vendorManager.openEdit(vendor.VOrgSecuencia)
        }
        onDelete={() =>
          vendor && vendorDelete.openDeleteModal(vendor.VId, vendor.VNombre)
        }
        quickActions={quickActions}
        notFoundMessage="The vendor you are looking for does not exist or has been deleted."
        notFoundIcon={<User className="h-12 w-12 text-muted-foreground" />}
      />

      {/* Vendedor Form Modal */}
      <VendedorFormModal
        isOpen={vendorManager.isOpen}
        onClose={vendorManager.close}
        mode={vendorManager.mode}
        form={vendorManager.form}
        onSubmit={vendorManager.onSubmit}
        isLoading={vendorManager.isMutating}
        isLoadingVendor={vendorManager.isLoadingVendor}
        vendorError={vendorManager.vendorError}
      />

      {/* Delete Confirmation Modal */}
      <EntityDeleteModal
        isOpen={vendorDelete.isDeleteModalOpen}
        onClose={vendorDelete.closeDeleteModal}
        onConfirm={vendorDelete.handleDeleteConfirm}
        entity="vendor"
        entityName={vendorDelete.vendorToDelete?.description || ""}
        isDeleting={vendorDelete.isDeleting}
      />
    </>
  );
}
