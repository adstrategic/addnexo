"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProducts } from "../hooks/useCatalog";
import { useProductManager } from "../hooks/useCatalogManager";
import { useProductDelete } from "../hooks/useCatalogDelete";
import { useCatalogListParams } from "../hooks/useCatalogListParams";
import { ProductTable } from "./CatalogTable";
import { CatalogListToolbar } from "./CatalogListToolbar";
import { ProductAction } from "./CatalogAction";
import { CatalogPageHeader } from "./layout/CatalogPageHeader";
import { catalogListPadding } from "./layout/catalog-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ProductFormModal } from "../forms/CatalogFormModal";

export function ProductContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    originId,
    setOriginId,
    unitId,
    setUnitId,
    grupoId,
    setGrupoId,
    clearFilters,
    hasActiveFilters,
  } = useCatalogListParams();

  const productManager = useProductManager();
  const productDelete = useProductDelete();

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useProducts({
    page: currentPage,
    search: debouncedSearch,
    paisId: originId,
    unidadId: unitId,
    grupoId,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Products" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <CatalogPageHeader
        title="Products"
        description="Manage your product catalog and inventory"
        actions={
          <ProductAction onOpenCreateModal={productManager.openCreate} />
        }
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${catalogListPadding.toolbar}`}
          >
            <CatalogListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              originId={originId}
              onOriginChange={setOriginId}
              unitId={unitId}
              onUnitChange={setUnitId}
              grupoId={grupoId}
              onGrupoChange={setGrupoId}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <ProductTable
            productos={data?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onEdit={(sequence) => productManager.openEdit(sequence)}
            onDelete={(id, descripcion) =>
              productDelete.openDeleteModal(id, descripcion)
            }
            currentPage={currentPage}
            totalPages={data?.pagination.totalPages ?? 1}
            totalItems={data?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={productManager.openCreate}
          />
        </CardContent>
      </Card>

      <ProductFormModal
        isOpen={productManager.isOpen}
        onClose={productManager.close}
        mode={productManager.mode}
        initialData={productManager.product}
        form={productManager.form}
        onSubmit={productManager.onSubmit}
        isLoading={productManager.isMutating}
        isLoadingProduct={productManager.isLoadingProduct}
        productError={productManager.productError}
      />

      <EntityDeleteModal
        isOpen={productDelete.isDeleteModalOpen}
        onClose={productDelete.closeDeleteModal}
        onConfirm={productDelete.handleDeleteConfirm}
        entity="product"
        entityName={productDelete.productoAEliminar?.CKDescripcion || ""}
        isDeleting={productDelete.isDeleting}
      />
    </div>
  );
}
