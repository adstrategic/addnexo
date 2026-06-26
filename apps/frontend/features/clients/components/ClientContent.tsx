"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useClients } from "../hooks/useClients";
import { useClientManager } from "../hooks/useClientFormManager";
import { useClientDelete } from "../hooks/useClientDelete";
import { useClientListParams } from "../hooks/useClientListParams";
import { ClientTable } from "./ClientTable";
import { ClientListToolbar } from "./ClientListToolbar";
import { ClientActions } from "./ClientAction";
import { ClientPageHeader } from "./layout/ClientPageHeader";
import { clientListPadding } from "./layout/client-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { ClientFormModal } from "../forms/ClientFormModal";

export function ClientsContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useClientListParams();

  const clientManager = useClientManager();
  const clientDelete = useClientDelete();

  const { data, isLoading, isFetching, error } = useClients({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Clients" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <ClientPageHeader
        title="Clients"
        description="Manage your customers and their information"
        actions={<ClientActions onOpenCreateModal={clientManager.openCreate} />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div className={`border-b border-border ${clientListPadding.toolbar}`}>
            <ClientListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
            />
          </div>

          <ClientTable
            clientes={data?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={clientDelete.openDeleteModal}
            onEdit={(sequence) => clientManager.openEdit(sequence)}
            currentPage={currentPage}
            totalPages={data?.pagination.totalPages ?? 1}
            totalItems={data?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={clientManager.openCreate}
          />
        </CardContent>
      </Card>

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

      <EntityDeleteModal
        isOpen={clientDelete.isDeleteModalOpen}
        onClose={clientDelete.closeDeleteModal}
        onConfirm={clientDelete.handleDeleteConfirm}
        entity="client"
        entityName={clientDelete.clienteAEliminar?.descripcion ?? ""}
        isDeleting={clientDelete.isDeleting}
      />
    </div>
  );
}
