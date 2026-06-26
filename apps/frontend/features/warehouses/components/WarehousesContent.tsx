"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAlmacenes } from "../hooks/useAlmacenes";
import { useAlmacenManager } from "../hooks/useAlmacenManager";
import { useAlmacenDelete } from "../hooks/useAlmacenDelete";
import { useWarehouseListParams } from "../hooks/useWarehouseListParams";
import { WarehouseTable } from "./WarehouseTable";
import { WarehouseListToolbar } from "./WarehouseListToolbar";
import { AlmacenActions } from "./AlmacenAction";
import { WarehousePageHeader } from "./layout/WarehousePageHeader";
import { warehouseListPadding } from "./layout/warehouse-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { AlmacenFormModal } from "../forms/AlmacenFormModal";

export function WarehousesContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useWarehouseListParams();

  const almacenManager = useAlmacenManager();
  const almacenDelete = useAlmacenDelete();

  const {
    data: almacenesData,
    isLoading,
    isFetching,
    error,
  } = useAlmacenes({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Warehouses" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <WarehousePageHeader
        title="Warehouses"
        description="Manage your warehouses and storage locations"
        actions={
          <AlmacenActions onOpenCreateModal={almacenManager.openCreate} />
        }
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${warehouseListPadding.toolbar}`}
          >
            <WarehouseListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
            />
          </div>

          <WarehouseTable
            almacenes={almacenesData?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={almacenDelete.openDeleteModal}
            onEdit={(sequence) => almacenManager.openEdit(sequence)}
            currentPage={currentPage}
            totalPages={almacenesData?.pagination.totalPages ?? 1}
            totalItems={almacenesData?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={almacenManager.openCreate}
          />
        </CardContent>
      </Card>

      <AlmacenFormModal
        isOpen={almacenManager.isOpen}
        onClose={almacenManager.close}
        mode={almacenManager.mode}
        initialData={almacenManager.almacen}
        form={almacenManager.form}
        onSubmit={almacenManager.onSubmit}
        isLoading={almacenManager.isMutating}
        isLoadingAlmacen={almacenManager.isLoadingAlmacen}
        almacenError={almacenManager.almacenError}
      />

      <EntityDeleteModal
        isOpen={almacenDelete.isDeleteModalOpen}
        onClose={almacenDelete.closeDeleteModal}
        onConfirm={almacenDelete.handleDeleteConfirm}
        entity="warehouse"
        entityName={almacenDelete.almacenToDelete?.description ?? ""}
        isDeleting={almacenDelete.isDeleting}
      />
    </div>
  );
}
