"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSuppliers } from "../hooks/useSuppliers";
import { useSupplierFormManager } from "../hooks/useSupplierFormManager";
import { useSupplierDelete } from "../hooks/useSupplierDelete";
import { SupplierTable } from "./SuppliersTable";
import { SupplierFilters } from "./SuppliersFilters";
import { SupplierActions } from "./SupplierActions";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { SupplierFormModal } from "../forms/SupplierFormModal";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useTabState } from "@/hooks/useTabState";

export function SuppliersContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { setTab } = useTabState({
    defaultValue: "todos",
    resetPaginationOnChange: true,
  });

  const supplierManager = useSupplierFormManager();
  const supplierDelete = useSupplierDelete();

  const {
    data: suppliersData,
    isLoading,
    error,
  } = useSuppliers({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Suppliers" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your fruit and service suppliers
          </p>
        </div>

        <SupplierActions onOpenCreateModal={supplierManager.openCreate} />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <SupplierFilters searchTerm={searchTerm} onSearchChange={setSearch} />
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
              <SupplierTable
                proveedores={suppliersData?.data || []}
                isLoading={isLoading}
                onDelete={supplierDelete.openDeleteModal}
                onEdit={(sequence) => supplierManager.openEdit(sequence)}
                currentPage={currentPage}
                totalPages={suppliersData?.pagination.totalPages || 1}
                totalItems={suppliersData?.pagination.totalItems || 0}
                onPageChange={setPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Supplier Form Modal - handles both create and edit */}
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

      {/* Delete Confirmation Modal */}
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
