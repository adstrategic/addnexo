"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useSuppliers } from "../hooks/useSuppliers";
import { useSupplierFormManager } from "../hooks/useSupplierFormManager";
import { useSupplierDelete } from "../hooks/useSupplierDelete";
import { useSupplierListParams } from "../hooks/useSupplierListParams";
import { SupplierTable } from "./SuppliersTable";
import { SupplierListToolbar } from "./SupplierListToolbar";
import { SupplierActions } from "./SupplierActions";
import { SupplierPageHeader } from "./layout/SupplierPageHeader";
import { supplierListPadding } from "./layout/supplier-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { SupplierFormModal } from "../forms/SupplierFormModal";

export function SuppliersContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    countryId,
    setCountryId,
    clearFilters,
    hasActiveFilters,
  } = useSupplierListParams();

  const supplierManager = useSupplierFormManager();
  const supplierDelete = useSupplierDelete();

  const {
    data: suppliersData,
    isLoading,
    isFetching,
    error,
  } = useSuppliers({
    page: currentPage,
    search: debouncedSearch,
    countryId,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Suppliers" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <SupplierPageHeader
        title="Suppliers"
        description="Manage your fruit and service suppliers"
        actions={
          <SupplierActions onOpenCreateModal={supplierManager.openCreate} />
        }
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${supplierListPadding.toolbar}`}
          >
            <SupplierListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              countryId={countryId}
              onCountryChange={setCountryId}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
              isFetching={isFetching && !isLoading}
              totalItems={suppliersData?.pagination.totalItems}
            />
          </div>

          <SupplierTable
            proveedores={suppliersData?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={supplierDelete.openDeleteModal}
            onEdit={(sequence) => supplierManager.openEdit(sequence)}
            currentPage={currentPage}
            totalPages={suppliersData?.pagination.totalPages ?? 1}
            totalItems={suppliersData?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={supplierManager.openCreate}
          />
        </CardContent>
      </Card>

      <SupplierFormModal
        isOpen={supplierManager.isOpen}
        onClose={supplierManager.close}
        mode={supplierManager.mode}
        initialData={supplierManager.supplier}
        onSubmit={supplierManager.onSubmit}
        form={supplierManager.form}
        isLoading={supplierManager.isMutating}
        isLoadingSupplier={supplierManager.isLoadingSupplier}
        supplierError={supplierManager.supplierError}
      />

      <EntityDeleteModal
        isOpen={supplierDelete.isDeleteModalOpen}
        onClose={supplierDelete.closeDeleteModal}
        onConfirm={supplierDelete.handleDeleteConfirm}
        entity="supplier"
        entityName={supplierDelete.supplierToDelete?.description || ""}
        isDeleting={supplierDelete.isDeleting}
      />
    </div>
  );
}
