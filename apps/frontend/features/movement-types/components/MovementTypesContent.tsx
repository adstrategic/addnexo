"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useMovementTypes } from "../hooks/useMovementTypes";
import { useMovementTypeManager } from "../hooks/useMovementTypeManager";
import { useMovementTypeDelete } from "../hooks/useMovementTypeDelete";
import { useMovementTypeListParams } from "../hooks/useMovementTypeListParams";
import { MovementTypeTable } from "./MovementTypeTable";
import { MovementTypeListToolbar } from "./MovementTypeListToolbar";
import { MovementTypeAction } from "./MovementTypeAction";
import { MovementTypePageHeader } from "./layout/MovementTypePageHeader";
import { movementTypeListPadding } from "./layout/movement-type-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { MovementTypeFormModal } from "../forms/MovementTypeFormModal";

export function MovementTypesContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useMovementTypeListParams();

  const movementTypeManager = useMovementTypeManager();
  const movementTypeDelete = useMovementTypeDelete();

  const { data, isLoading, isFetching, error } = useMovementTypes({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Movement Types" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <MovementTypePageHeader
        title="Movement Types"
        description="Manage your inventory movement types and configurations"
        actions={
          <MovementTypeAction
            onOpenCreateModal={movementTypeManager.openCreate}
          />
        }
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${movementTypeListPadding.toolbar}`}
          >
            <MovementTypeListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
            />
          </div>

          <MovementTypeTable
            tiposMovimiento={data?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={movementTypeDelete.openDeleteModal}
            onEdit={(movementType) =>
              movementTypeManager.openEdit(movementType.TOrgSecuencia)
            }
            currentPage={currentPage}
            totalPages={data?.pagination.totalPages ?? 1}
            totalItems={data?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={movementTypeManager.openCreate}
          />
        </CardContent>
      </Card>

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
    </div>
  );
}
