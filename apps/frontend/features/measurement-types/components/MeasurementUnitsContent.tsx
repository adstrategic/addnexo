"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useUnits } from "../hooks/useUnits";
import { useUnitManager } from "../hooks/useUnitFormManager";
import { useUnitDelete } from "../hooks/useUnitDelete";
import { useUnitListParams } from "../hooks/useUnitListParams";
import { UnitTable } from "./UnitTable";
import { UnitListToolbar } from "./UnitListToolbar";
import { UnitActions } from "./UnitActions";
import { UnitPageHeader } from "./layout/UnitPageHeader";
import { unitListPadding } from "./layout/unit-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { UnitFormModal } from "../forms/UnitFormModal";

export function MeasurementUnitsContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useUnitListParams();

  const unitManager = useUnitManager();
  const unitDelete = useUnitDelete();

  const {
    data: unitsData,
    isLoading,
    isFetching,
    error,
  } = useUnits({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Measurement Units" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <UnitPageHeader
        title="Measurement Units"
        description="Manage your measurement units and categories"
        actions={<UnitActions onOpenCreateModal={unitManager.openCreate} />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div className={`border-b border-border ${unitListPadding.toolbar}`}>
            <UnitListToolbar searchTerm={searchTerm} onSearchChange={setSearch} />
          </div>

          <UnitTable
            units={unitsData?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={unitDelete.openDeleteModal}
            onEdit={(sequence) => unitManager.openEdit(sequence)}
            currentPage={currentPage}
            totalPages={unitsData?.pagination.totalPages ?? 1}
            totalItems={unitsData?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={unitManager.openCreate}
          />
        </CardContent>
      </Card>

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
        entityName={unitDelete.unitToDelete?.description ?? ""}
        isDeleting={unitDelete.isDeleting}
      />
    </div>
  );
}
