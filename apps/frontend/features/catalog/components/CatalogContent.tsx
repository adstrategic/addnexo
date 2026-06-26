"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "../hooks/useCatalog";
import { useProductManager } from "../hooks/useCatalogManager";
import { useProductDelete } from "../hooks/useCatalogDelete";
import { ProductFormModal } from "../forms/CatalogFormModal";
import { ProductTable } from "./CatalogTable";
import { ProductFilter } from "./CatalogFilter";
import { ProductAction } from "./CatalogAction";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useTabState } from "@/hooks/useTabState";

export function ProductContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { selectedTab, setTab } = useTabState({
    defaultValue: "todos",
    resetPaginationOnChange: true,
  });
  // Hook para manejo del Formulario (Create/Edit)
  const productManager = useProductManager();

  // Hook para manejo de Eliminación
  const productDelete = useProductDelete();

  // Query para obtener productos
  const { data, isLoading, error } = useProducts({
    search: debouncedSearch || undefined,
    page: currentPage,
  });

  // Manejo de errores
  if (error) {
    return <ErrorBoundary error={error} entityName="Products" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>

        <ProductAction onOpenCreateModal={productManager.openCreate} />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <ProductFilter
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            onFilterChange={(filter) => console.log("Filter:", filter)}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="todos" className="w-full" onValueChange={setTab}>
            <div className="border-b px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="todos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:shadow-none rounded-none"
                >
                  All
                </TabsTrigger>
                {/* Futuras pestañas para filtros por estado */}
              </TabsList>
            </div>

            <TabsContent value="todos" className="p-0">
              <ProductTable
                productos={data?.data ?? []}
                isLoading={isLoading}
                onEdit={(producto) =>
                  productManager.openEdit(producto.CKOrgSecuencia)
                }
                onDelete={(id, descripcion) =>
                  productDelete.openDeleteModal(id, descripcion)
                }
                currentPage={currentPage}
                totalPages={data?.pagination.totalPages || 1}
                totalItems={data?.pagination.totalItems || 0}
                onPageChange={setPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Product Form Modal - handles both create and edit */}
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

      {/* Delete Confirmation Modal - Separate logic */}
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
