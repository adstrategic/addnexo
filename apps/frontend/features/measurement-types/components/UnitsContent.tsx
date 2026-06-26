"use client";

import { UnitTable } from "./UnitTable";
import { UnitFilters } from "./UnitFilters";
import { UnitActions } from "./UnitActions";
import { useUnits } from "../hooks/useUnits";
import { useUnitManager } from "../hooks/useUnitFormManager";
import { useUnitDelete } from "../hooks/useUnitDelete";
import { UnitFormModal } from "../forms/UnitFormModal";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

/**
 * Units (measurement types) page content.
 * Displays unit list with server-side search, pagination, and management actions.
 */
export default function UnitsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const unitManager = useUnitManager();
  const {
    data: unitsData,
    isLoading,
    error,
  } = useUnits({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const unitDelete = useUnitDelete();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !unitsData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading units. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const units = unitsData.data;
  const pagination = unitsData.pagination;

  return (
    <>
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Units
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your measurement units and categories
            </p>
          </div>
          <UnitActions onOpenCreateModal={unitManager.openCreate} />
        </div>

        <Card>
          <CardHeader className="p-4">
            <UnitFilters searchTerm={searchTerm} onSearchChange={setSearch} />
          </CardHeader>
          <CardContent className="p-0">
            <UnitTable
              units={units}
              isLoading={false}
              onEdit={(unit) => unitManager.openEdit(unit.UMOrgSecuencia)}
              onDelete={unitDelete.openDeleteModal}
            >
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={setPage}
                emptyMessage="No units found"
                itemLabel="units"
              />
            </UnitTable>
          </CardContent>
        </Card>
      </div>

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
    </>
  );
}
