"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClients } from "../hooks/useClients";
import { useClientManager } from "../hooks/useClientFormManager";
import { useClientDelete } from "../hooks/useClientDelete"; // Nuevo hook separado
import { ClientTable } from "./ClientTable";
import { ClientFilters } from "./ClientFilter";
import { ClientActions } from "./ClientAction";
import { ErrorBoundary } from "../../../components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ClientFormModal } from "../forms/ClientFormModal";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useTabState } from "@/hooks/useTabState";

export function ClientsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { setTab } = useTabState({
    defaultValue: "todos",
    resetPaginationOnChange: true,
  });

  // Hook para manejo del Formulario (Create/Edit)
  const clientManager = useClientManager();

  // Hook para manejo de Eliminación
  const clientDelete = useClientDelete();

  // Query para obtener clientes
  const { data, isLoading, error } = useClients({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Clients" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customers and their information
          </p>
        </div>

        <ClientActions onOpenCreateModal={clientManager.openCreate} />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <ClientFilters searchTerm={searchTerm} onSearchChange={setSearch} />
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
              <ClientTable
                clientes={data?.data || []}
                isLoading={isLoading}
                onDelete={clientDelete.openDeleteModal}
                onEdit={clientManager.openEdit}
                currentPage={currentPage}
                totalPages={data?.pagination.totalPages || 1}
                totalItems={data?.pagination.totalItems || 0}
                onPageChange={setPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Client Form Modal - handles both create and edit */}
      <ClientFormModal
        isOpen={clientManager.isOpen}
        onClose={clientManager.close}
        mode={clientManager.mode}
        initialData={clientManager.client}
        form={clientManager.form}
        onSubmit={clientManager.onSubmit}
        isLoading={clientManager.isMutating}
        isLoadingClient={clientManager.isLoadingClient}
        clientError={clientManager.clientError}
      />

      {/* Delete Confirmation Modal - Separate logic */}
      <EntityDeleteModal
        isOpen={clientDelete.isDeleteModalOpen}
        onClose={clientDelete.closeDeleteModal}
        onConfirm={clientDelete.handleDeleteConfirm}
        entity="client"
        entityName={clientDelete.clienteAEliminar?.descripcion || ""}
        isDeleting={clientDelete.isDeleting}
      />
    </div>
  );
}
