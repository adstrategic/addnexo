"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Package,
  Plus,
  Ruler,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUnitBySequence } from "../hooks/useUnits";
import { useUnitManager } from "../hooks/useUnitFormManager";
import { useUnitDelete } from "../hooks/useUnitDelete";
import { UnitFormModal } from "../forms/UnitFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { UnitProductsList } from "./UnitProductsList";
import { ErrorBoundary } from "@/components/error-boundary";
import { UnitDetailsView } from "./UnitDetailsView";

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

  const handleEdit = () => {
    if (unit) {
      unitManager.openEdit(unit.UMOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (unit) {
      unitDelete.openDeleteModal(unit);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Measurement Unit" />
      </div>
    );
  }

  if (!isLoading && !unit) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <Ruler className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Unit not found</h2>
          <p className="text-sm text-muted-foreground">
            The unit you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/measurement-types">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to measurement units
          </Link>
        </Button>
      </div>
    );
  }

  const sections = unit
    ? [
        {
          title: "General Information",
          icon: <Ruler className="size-4" aria-hidden />,
          fields: [
            {
              label: "Code",
              value: <Badge variant="secondary">{unit.UMNombre}</Badge>,
              icon: <Ruler className="size-4" aria-hidden />,
            },
            {
              label: "Description",
              value: unit.UMDescripcion,
              icon: <FileText className="size-4" aria-hidden />,
            },
          ],
        },
      ]
    : [];

  const quickActions = [
    {
      label: "View Products",
      icon: <Package className="size-5" aria-hidden />,
      onClick: () => {
        document.getElementById("unit-products")?.scrollIntoView({
          behavior: "smooth",
        });
      },
    },
    {
      label: "Add Product",
      icon: <Plus className="size-5" aria-hidden />,
      onClick: () => window.open("/products", "_blank"),
    },
    {
      label: "View Statistics",
      icon: <BarChart3 className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to unit usage statistics
      },
    },
    {
      label: "View Reports",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to unit reports
      },
    },
  ];

  return (
    <>
      <UnitDetailsView
        title={unit?.UMDescripcion ?? ""}
        subtitle={unit ? `Code: ${unit.UMNombre}` : undefined}
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      >
        {unit ? (
          <div id="unit-products" className="mt-2">
            <Suspense
              fallback={
                <div className="p-4 text-muted-foreground">
                  Loading products…
                </div>
              }
            >
              <UnitProductsList unitId={unit.UMId} unitName={unit.UMNombre} />
            </Suspense>
          </div>
        ) : null}
      </UnitDetailsView>

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
