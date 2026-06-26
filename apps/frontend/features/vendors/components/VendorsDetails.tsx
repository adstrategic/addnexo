"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVendorBySequence } from "../hooks/useVendors";
import { useVendorManager } from "../hooks/useVendorManager";
import { useVendorDelete } from "../hooks/useVendorDelete";
import { VendedorFormModal } from "../forms/VendorFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  VendorDetailsView,
  renderContactValue,
} from "./VendorDetailsView";

interface VendorDetailsProps {
  vendorSequence: number;
}

export function VendorDetails({ vendorSequence }: VendorDetailsProps) {
  const router = useRouter();
  const {
    data: vendor,
    isLoading,
    error,
  } = useVendorBySequence(vendorSequence, !!vendorSequence);

  const vendorManager = useVendorManager();
  const vendorDelete = useVendorDelete({
    onAfterDelete: () => router.push("/vendors"),
  });

  const handleEdit = () => {
    if (vendor) {
      vendorManager.openEdit(vendor.VOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (vendor) {
      vendorDelete.openDeleteModal(vendor.VId, vendor.VNombre);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Vendor" />
      </div>
    );
  }

  if (!isLoading && !vendor) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <UserRound className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Vendor not found</h2>
          <p className="text-sm text-muted-foreground">
            The vendor you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/vendors">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to vendors
          </Link>
        </Button>
      </div>
    );
  }

  const sections = vendor
    ? [
        {
          title: "General Information",
          icon: <UserRound className="size-4" aria-hidden />,
          fields: [
            {
              label: "NIT/ID",
              value: vendor.VNitCedula,
              icon: <CreditCard className="size-4" aria-hidden />,
            },
            {
              label: "Phone",
              value: renderContactValue(vendor.VTelefono, "phone"),
              icon: <Phone className="size-4" aria-hidden />,
            },
            {
              label: "Email",
              value: renderContactValue(vendor.VCorreo, "email"),
              icon: <Mail className="size-4" aria-hidden />,
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
        if (vendor?.VNombre) {
          router.push(`/invoices?search=${encodeURIComponent(vendor.VNombre)}`);
        }
      },
    },
    {
      label: "View Orders",
      icon: <UserRound className="size-5" aria-hidden />,
      onClick: () => {
        if (vendor?.VNombre) {
          router.push(
            `/dispatch-orders?search=${encodeURIComponent(vendor.VNombre)}`,
          );
        }
      },
    },
  ];

  return (
    <>
      <VendorDetailsView
        title={vendor?.VNombre ?? ""}
        subtitle={vendor ? `NIT: ${vendor.VNitCedula}` : undefined}
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      />

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

      <EntityDeleteModal
        isOpen={vendorDelete.isDeleteModalOpen}
        onClose={vendorDelete.closeDeleteModal}
        onConfirm={vendorDelete.handleDeleteConfirm}
        entity="vendor"
        entityName={vendorDelete.vendorToDelete?.description ?? ""}
        isDeleting={vendorDelete.isDeleting}
      />
    </>
  );
}
