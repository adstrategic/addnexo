"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useVendors } from "../hooks/useVendors";
import { useVendorManager } from "../hooks/useVendorManager";
import { useVendorDelete } from "../hooks/useVendorDelete";
import { useVendorListParams } from "../hooks/useVendorListParams";
import { VendorTable } from "./VendorsTable";
import { VendorListToolbar } from "./VendorListToolbar";
import { VendedorActions } from "./VendorsActions";
import { VendorPageHeader } from "./layout/VendorPageHeader";
import { vendorListPadding } from "./layout/vendor-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { VendedorFormModal } from "../forms/VendorFormModal";

export function VendorsContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useVendorListParams();

  const vendorManager = useVendorManager();
  const vendorDelete = useVendorDelete();

  const { data, isLoading, isFetching, error } = useVendors({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Vendors" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <VendorPageHeader
        title="Vendors"
        description="Manage your sales representatives and their information"
        actions={
          <VendedorActions onOpenCreateModal={vendorManager.openCreate} />
        }
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div className={`border-b border-border ${vendorListPadding.toolbar}`}>
            <VendorListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
            />
          </div>

          <VendorTable
            vendors={data?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={vendorDelete.openDeleteModal}
            onEdit={(sequence) => vendorManager.openEdit(sequence)}
            currentPage={currentPage}
            totalPages={data?.pagination.totalPages ?? 1}
            totalItems={data?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={vendorManager.openCreate}
          />
        </CardContent>
      </Card>

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
    </div>
  );
}
