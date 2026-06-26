"use client";

import { useMovementType } from "../hooks/useMovementTypes";
import { useMovementTypeManager } from "../hooks/useMovementTypeManager";
import { useMovementTypeDelete } from "../hooks/useMovementTypeDelete";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import { FileText, Settings, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { MovementTypeFormModal } from "../forms/MovementTypeFormModal";
import { MovementTypeMovementsTable } from "./MovementTypeMovementsTable";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { getMovementTypeDescription } from "../lib/utils";

interface MovementTypeDetailProps {
  sequence: number;
}

export function MovementTypeDetail({ sequence }: MovementTypeDetailProps) {
  const router = useRouter();

  // Hook para obtener el tipo de movimiento
  const { data: tipoMovimiento, isLoading, error } = useMovementType(sequence);

  // Hook para manejo del Formulario (Create/Edit)
  const movementTypeManager = useMovementTypeManager();

  // Hook para manejo de Eliminación
  const movementTypeDelete = useMovementTypeDelete();

  const handleViewMovements = () => {
    // TODO: Implement navigation to movements list
    console.log("View movements for type:", tipoMovimiento?.TId);
  };

  const handleAddMovement = () => {
    // TODO: Implement add movement functionality
    console.log("Add movement for type:", tipoMovimiento?.TId);
  };

  const handleBackToList = () => {
    router.push("/movement-types");
  };

  // Prepare information sections
  const sections: EntitySection[] = tipoMovimiento
    ? [
        {
          title: "General Information",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "Description",
              value: tipoMovimiento.TDescripcion,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Abbreviation",
              value: tipoMovimiento.TAbreviatura,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Configuration",
          icon: <Settings className="h-5 w-5" />,
          fields: [
            {
              label: "Affects Inventory",
              value: tipoMovimiento.TAfecta ? "Yes" : "No",
              icon: <Settings className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Requires Client Purchase Order",
              value: tipoMovimiento.TPedido ? "Yes" : "No",
              icon: <Settings className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Requires Supplier Purchase Order",
              value: tipoMovimiento.TRequiere ? "Yes" : "No",
              icon: <Settings className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Requires Invoice",
              value: tipoMovimiento.TFactura ? "Yes" : "No",
              icon: <Settings className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Requires Supplier",
              value: tipoMovimiento.TProv ? "Yes" : "No",
              icon: <Settings className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
      ]
    : [];

  // Prepare quick actions
  const quickActions: EntityAction[] = [
    {
      label: "View Movements",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewMovements,
    },
    {
      label: "Add Movement",
      icon: <Plus className="h-6 w-6" />,
      onClick: handleAddMovement,
    },
  ];

  return (
    <>
      <EntityDetails
        title={tipoMovimiento?.TDescripcion || ""}
        subtitle={
          tipoMovimiento
            ? `${getMovementTypeDescription(tipoMovimiento.TTipo)} | Class: ${tipoMovimiento.TClase}`
            : ""
        }
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() => {
          if (tipoMovimiento) {
            movementTypeManager.openEdit(tipoMovimiento.TOrgSecuencia);
          }
        }}
        onDelete={() => {
          if (tipoMovimiento) {
            movementTypeDelete.openDeleteModal(
              tipoMovimiento.TId,
              tipoMovimiento.TDescripcion,
              tipoMovimiento.TOrgSecuencia,
            );
          }
        }}
        quickActions={quickActions}
        notFoundMessage="The movement type you are looking for does not exist or has been deleted."
        notFoundIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
        onBack={handleBackToList}
        backButtonText="Back to Movement Types"
      />

      {/* Movimientos asociados */}
      {tipoMovimiento && (
        <div className="mt-6">
          <MovementTypeMovementsTable
            sequence={sequence}
            tipoMovimiento={tipoMovimiento}
          />
        </div>
      )}

      {/* Edit Modal */}
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

      {/* Delete Confirmation Modal */}
      <EntityDeleteModal
        isOpen={movementTypeDelete.isDeleteModalOpen}
        onClose={movementTypeDelete.closeDeleteModal}
        onConfirm={movementTypeDelete.handleDeleteConfirm}
        entity="movement type"
        entityName={movementTypeDelete.movementTypeAEliminar?.descripcion || ""}
        isDeleting={movementTypeDelete.isDeleting}
      />
    </>
  );
}
