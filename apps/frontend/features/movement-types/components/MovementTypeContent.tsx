"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovementTypes } from "../hooks/useMovementTypes";
import { useMovementTypeManager } from "../hooks/useMovementTypeManager";
import { useMovementTypeDelete } from "../hooks/useMovementTypeDelete";
import { MovementTypeTable } from "./MovementTypeTable";
import { MovementTypeFilter } from "./MovementTypeFilter";
import { MovementTypeAction } from "./MovementTypeAction";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { MovementTypeFormModal } from "../forms/MovementTypeFormModal";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useTabState } from "@/hooks/useTabState";

export function MovementTypeContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { selectedTab, setTab } = useTabState({
    defaultValue: "todos",
    resetPaginationOnChange: true,
  });

  // Hook para manejo del Formulario (Create/Edit)
  const movementTypeManager = useMovementTypeManager();

  // Hook para manejo de Eliminación
  const movementTypeDelete = useMovementTypeDelete();

  // Query para obtener tipos de movimiento
  const { data, isLoading, error } = useMovementTypes({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Movement Types" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movement Types</h1>
          <p className="text-sm text-muted-foreground">
            Manage your inventory movement types and configurations
          </p>
        </div>

        <MovementTypeAction
          onOpenCreateModal={movementTypeManager.openCreate}
        />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <MovementTypeFilter
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
              </TabsList>
            </div>

            <TabsContent value="todos" className="p-0">
              <MovementTypeTable
                tiposMovimiento={data?.data || []}
                isLoading={isLoading}
                onDelete={movementTypeDelete.openDeleteModal}
                onEdit={(movementType) => {
                  movementTypeManager.openEdit(movementType.TOrgSecuencia);
                }}
                currentPage={currentPage}
                totalPages={data?.pagination.totalPages || 1}
                totalItems={data?.pagination.totalItems || 0}
                onPageChange={setPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Movement Type Form Modal - handles both create and edit */}
      <MovementTypeFormModal
        isOpen={movementTypeManager.isOpen}
        onClose={movementTypeManager.close}
        mode={movementTypeManager.mode}
        initialData={movementTypeManager.movementType}
        form={movementTypeManager.form}
        onSubmit={movementTypeManager.onSubmit}
        isLoading={movementTypeManager.isMutating}
        isLoadingMovementType={movementTypeManager.isLoadingMovementType}
        movementTypeError={movementTypeManager.movementTypeError}
      />

      {/* Delete Confirmation Modal - Separate logic */}
      <EntityDeleteModal
        isOpen={movementTypeDelete.isDeleteModalOpen}
        onClose={movementTypeDelete.closeDeleteModal}
        onConfirm={movementTypeDelete.handleDeleteConfirm}
        entity="movement type"
        entityName={movementTypeDelete.movementTypeAEliminar?.descripcion || ""}
        isDeleting={movementTypeDelete.isDeleting}
      />
    </div>
  );
}
