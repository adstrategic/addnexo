"use client";

import { useUnitBySequence } from "../hooks/useUnits";
import { useUnitManager } from "../hooks/useUnitFormManager";
import { useUnitDelete } from "../hooks/useUnitDelete";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import { Ruler, FileText, Package, BarChart3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { UnitFormModal } from "../forms/UnitFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { UnitProductsList } from "./UnitProductsList";
import { Suspense } from "react";

interface UnitDetailsProps {
  unitSequence: number;
}

export function UnitDetails({ unitSequence }: UnitDetailsProps) {
  const router = useRouter();
  const {
    data: unit,
    isLoading,
    error,
  } = useUnitBySequence(unitSequence, !!unitSequence);

  const unitManager = useUnitManager();
  const unitDelete = useUnitDelete({
    onAfterDelete: () => router.push("/measurement-types"),
  });

  const handleViewProducts = () => {
    document.getElementById("unit-products")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleViewStatistics = () => {
    // TODO: Implement navigation to unit usage statistics
  };

  const handleViewReports = () => {
    // TODO: Implement navigation to unit reports
  };

  const handleAddProduct = () => {
    window.open("/products", "_blank");
  };

  const sections: EntitySection[] = unit
    ? [
        {
          title: "General Information",
          icon: <Ruler className="h-5 w-5" />,
          fields: [
            {
              label: "Name",
              value: unit.UMNombre,
              icon: <Ruler className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Description",
              value: unit.UMDescripcion,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
      ]
    : [];

  const quickActions: EntityAction[] = [
    {
      label: "View Products",
      icon: <Package className="h-6 w-6" />,
      onClick: handleViewProducts,
    },
    {
      label: "Add Product",
      icon: <Plus className="h-6 w-6" />,
      onClick: handleAddProduct,
    },
    {
      label: "View Statistics",
      icon: <BarChart3 className="h-6 w-6" />,
      onClick: handleViewStatistics,
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
        title={unit?.UMDescripcion ?? ""}
        subtitle={unit ? `Unit: ${unit.UMNombre}` : ""}
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() => unit && unitManager.openEdit(unit.UMOrgSecuencia)}
        onDelete={() => unit && unitDelete.openDeleteModal(unit)}
        quickActions={quickActions}
        notFoundMessage="The unit you are looking for does not exist or has been deleted."
        notFoundIcon={<Ruler className="h-12 w-12 text-muted-foreground" />}
      />

      {unit && (
        <div id="unit-products" className="mt-6 px-4 mb-10">
          <Suspense
            fallback={
              <div className="p-4 text-muted-foreground">Loading products…</div>
            }
          >
            <UnitProductsList unitId={unit.UMId} unitName={unit.UMNombre} />
          </Suspense>
        </div>
      )}

      <UnitFormModal
        isOpen={unitManager.isOpen}
        onClose={unitManager.close}
        mode={unitManager.mode}
        initialData={unitManager.unit}
        form={unitManager.form}
        onSubmit={unitManager.onSubmit}
        isLoading={unitManager.isMutating}
        isLoadingUnit={unitManager.isLoadingUnit}
        unitError={unitManager.unitError}
      />

      <EntityDeleteModal
        isOpen={unitDelete.isDeleteModalOpen}
        onClose={unitDelete.closeDeleteModal}
        onConfirm={unitDelete.handleDeleteConfirm}
        entity="unit"
        entityName={
          unit?.UMDescripcion ?? unitDelete.unitToDelete?.description ?? ""
        }
        isDeleting={unitDelete.isDeleting}
      />
    </>
  );
}
