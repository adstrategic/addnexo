"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMovementType } from "../hooks/useMovementTypes";
import { useMovementTypeManager } from "../hooks/useMovementTypeManager";
import { useMovementTypeDelete } from "../hooks/useMovementTypeDelete";
import { MovementTypeFormModal } from "../forms/MovementTypeFormModal";
import { MovementTypeMovementsTable } from "./MovementTypeMovementsTable";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ErrorBoundary } from "@/components/error-boundary";
import { MovementTypeDetailsView } from "./MovementTypeDetailsView";
import {
  formatPurpose,
  getBooleanDisplayText,
  getMovementTypeDescription,
} from "../lib/utils";

interface MovementTypeDetailProps {
  sequence: number;
}

export function MovementTypeDetail({ sequence }: MovementTypeDetailProps) {
  const router = useRouter();
  const { data: tipoMovimiento, isLoading, error } = useMovementType(sequence);

  const movementTypeManager = useMovementTypeManager();
  const movementTypeDelete = useMovementTypeDelete({
    onAfterDelete: () => router.push("/movement-types"),
  });

  const handleEdit = () => {
    if (tipoMovimiento) {
      movementTypeManager.openEdit(tipoMovimiento.TOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (tipoMovimiento) {
      movementTypeDelete.openDeleteModal(
        tipoMovimiento.TId,
        tipoMovimiento.TDescripcion,
        tipoMovimiento.TOrgSecuencia,
      );
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Movement Type" />
      </div>
    );
  }

  if (!isLoading && !tipoMovimiento) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <FileText className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Movement type not found</h2>
          <p className="text-sm text-muted-foreground">
            The movement type you are looking for does not exist or has been
            deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/movement-types">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to movement types
          </Link>
        </Button>
      </div>
    );
  }

  const sections = tipoMovimiento
    ? [
        {
          title: "General Information",
          icon: <FileText className="size-4" aria-hidden />,
          fields: [
            {
              label: "Type",
              value: getMovementTypeDescription(tipoMovimiento.TTipo),
              icon: <FileText className="size-4" aria-hidden />,
            },
            {
              label: "Class",
              value: (
                <Badge variant="secondary">Class {tipoMovimiento.TClase}</Badge>
              ),
              icon: <FileText className="size-4" aria-hidden />,
            },
            {
              label: "Description",
              value: tipoMovimiento.TDescripcion,
              icon: <FileText className="size-4" aria-hidden />,
            },
            {
              label: "Abbreviation",
              value: tipoMovimiento.TAbreviatura,
              icon: <FileText className="size-4" aria-hidden />,
            },
            {
              label: "Purpose",
              value: formatPurpose(tipoMovimiento.TProposito),
              icon: <Settings className="size-4" aria-hidden />,
            },
          ],
        },
        {
          title: "Configuration",
          icon: <Settings className="size-4" aria-hidden />,
          fields: [
            {
              label: "Affects Inventory",
              value: getBooleanDisplayText(tipoMovimiento.TAfecta),
              icon: <Settings className="size-4" aria-hidden />,
            },
            {
              label: "Requires Client Purchase Order",
              value: getBooleanDisplayText(tipoMovimiento.TPedido),
              icon: <Settings className="size-4" aria-hidden />,
            },
            {
              label: "Requires Supplier Purchase Order",
              value: getBooleanDisplayText(tipoMovimiento.TRequiere),
              icon: <Settings className="size-4" aria-hidden />,
            },
            {
              label: "Requires Invoice",
              value: getBooleanDisplayText(tipoMovimiento.TFactura),
              icon: <Settings className="size-4" aria-hidden />,
            },
            {
              label: "Requires Supplier",
              value: getBooleanDisplayText(tipoMovimiento.TProv),
              icon: <Settings className="size-4" aria-hidden />,
            },
            {
              label: "Requires Client",
              value: getBooleanDisplayText(tipoMovimiento.TCliente),
              icon: <Settings className="size-4" aria-hidden />,
            },
          ],
        },
      ]
    : [];

  const quickActions = [
    {
      label: "View Movements",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        document.getElementById("movement-type-movements")?.scrollIntoView({
          behavior: "smooth",
        });
      },
    },
    {
      label: "Add Movement",
      icon: <Plus className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Implement add movement functionality
      },
    },
  ];

  return (
    <>
      <MovementTypeDetailsView
        title={tipoMovimiento?.TDescripcion ?? ""}
        subtitle={
          tipoMovimiento
            ? `${getMovementTypeDescription(tipoMovimiento.TTipo)} · Class ${tipoMovimiento.TClase}`
            : undefined
        }
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      >
        {tipoMovimiento ? (
          <div id="movement-type-movements" className="mt-2">
            <MovementTypeMovementsTable
              sequence={sequence}
              tipoMovimiento={tipoMovimiento}
            />
          </div>
        ) : null}
      </MovementTypeDetailsView>

      <MovementTypeFormModal
        isOpen={movementTypeManager.isOpen}
        onClose={movementTypeManager.close}
        mode={movementTypeManager.mode}
        initialData={movementTypeManager.movementType}
        form={movementTypeManager.form}
        onSubmit={movementTypeManager.onSubmit}
        isLoading={movementTypeManager.isMutating}
        isLoadingMovementType={movementTypeManager.isLoadingMovementType}
        movementTypeError={movementTypeManager.movementTypeError}
      />

      <EntityDeleteModal
        isOpen={movementTypeDelete.isDeleteModalOpen}
        onClose={movementTypeDelete.closeDeleteModal}
        onConfirm={movementTypeDelete.handleDeleteConfirm}
        entity="movement type"
        entityName={movementTypeDelete.movementTypeAEliminar?.descripcion ?? ""}
        isDeleting={movementTypeDelete.isDeleting}
      />
    </>
  );
}
