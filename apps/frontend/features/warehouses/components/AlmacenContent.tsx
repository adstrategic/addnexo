"use client";

import { AlmacenTable } from "./AlmacenTable";
import { AlmacenFilters } from "./AlmacenFilter";
import { AlmacenActions } from "./AlmacenAction";
import { useAlmacenes } from "../hooks/useAlmacenes";
import { useAlmacenManager } from "../hooks/useAlmacenManager";
import { useAlmacenDelete } from "../hooks/useAlmacenDelete";
import { AlmacenFormModal } from "../forms/AlmacenFormModal";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

/**
 * Almacenes (warehouses) page content.
 * Displays warehouse list with server-side search, pagination, and management actions.
 */
export default function AlmacenContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const almacenManager = useAlmacenManager();
  const {
    data: almacenesData,
    isLoading,
    error,
  } = useAlmacenes({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const almacenDelete = useAlmacenDelete();

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

  if (error || !almacenesData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading warehouses. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const almacenes = almacenesData.data;
  const pagination = almacenesData.pagination;

  return (
    <>
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Warehouses
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your warehouses and storage locations
            </p>
          </div>
          <AlmacenActions onOpenCreateModal={almacenManager.openCreate} />
        </div>

        <Card>
          <CardHeader className="p-4">
            <AlmacenFilters searchTerm={searchTerm} onSearchChange={setSearch} />
          </CardHeader>
          <CardContent className="p-0">
            <AlmacenTable
              almacenes={almacenes}
              isLoading={false}
              onEdit={(almacen) =>
                almacenManager.openEdit(almacen.ALOrgSecuencia)
              }
              onDelete={almacenDelete.openDeleteModal}
            >
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={setPage}
                emptyMessage="No warehouses found"
                itemLabel="warehouses"
              />
            </AlmacenTable>
          </CardContent>
        </Card>
      </div>

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
    </>
  );
}
