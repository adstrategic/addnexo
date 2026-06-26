"use client";

// UI Components
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

// Hooks
import { useVendors } from "../hooks/useVendors";
import { useVendorManager } from "../hooks/useVendorManager";
import { useVendorDelete } from "../hooks/useVendorDelete";

// Components
import { VendedorTable } from "./VendorsTable";
import { VendedorFilters } from "./VendorsFilters";
import { VendedorActions } from "./VendorsActions";
import { VendedorFormModal } from "../forms/VendorFormModal";
import { useTabState } from "@/hooks/useTabState";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";

export default function VendorsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { setTab } = useTabState({
    defaultValue: "todos",
    resetPaginationOnChange: true,
  });

  // Hook para manejo del Formulario (Create/Edit)
  const vendorManager = useVendorManager();

  // Hook para manejo de Eliminación
  const vendorDelete = useVendorDelete();

  // Query para obtener vendedores
  const { data, isLoading, error } = useVendors({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  // Manejo de errores
  if (error) {
    return <ErrorBoundary error={error} entityName="Vendors" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendors and their information
          </p>
        </div>

        <VendedorActions onOpenCreateModal={vendorManager.openCreate} />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <VendedorFilters
            searchTerm={searchTerm}
            onSearchChange={setSearch}
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
              <VendedorTable
                vendors={data?.data || []}
                isLoading={isLoading}
                onDelete={(id, descripcion) =>
                  vendorDelete.openDeleteModal(id, descripcion)
                }
                onEdit={(vendedor) =>
                  vendorManager.openEdit(vendedor.VOrgSecuencia)
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

      {/* Vendedor Form Modal */}
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

      {/* Delete Confirmation Modal */}
      <EntityDeleteModal
        isOpen={vendorDelete.isDeleteModalOpen}
        onClose={vendorDelete.closeDeleteModal}
        onConfirm={vendorDelete.handleDeleteConfirm}
        entity="vendor"
        entityName={vendorDelete.vendorToDelete?.description || ""}
        isDeleting={vendorDelete.isDeleting}
      />
    </div>
  );
}
