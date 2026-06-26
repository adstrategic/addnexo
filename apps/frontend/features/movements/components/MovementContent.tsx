"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useMovements } from "../hooks/useMovements";
import { useMovementManager } from "../hooks/useMovementManager";
import { useMovementListParams } from "../hooks/useMovementListParams";
import { MovementFormModal } from "../forms/MovementFormModal";
import { MovementTable } from "./MovementTable";
import { MovementListToolbar } from "./MovementListToolbar";
import { MovementActions } from "./MovementActions";
import { MovementPageHeader } from "./layout/MovementPageHeader";
import { movementListPadding } from "./layout/movement-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { usePeriod } from "@/lib/context/period-context";

export function MovementContent() {
  const { closed } = usePeriod();
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    productId,
    setProductId,
    supplierId,
    setSupplierId,
    customerId,
    setCustomerId,
    clearFilters,
    hasActiveFilters,
  } = useMovementListParams();

  const movementManager = useMovementManager();

  const { data, isLoading, error, isFetching } = useMovements({
    page: currentPage,
    search: debouncedSearch,
    invcaruniId: productId,
    proveedorId: supplierId,
    clienteId: customerId,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Movements" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <MovementPageHeader
        title="Kardex Movements"
        description="Inventory entry and exit management"
        actions={
          <MovementActions
            onOpenCreateModal={movementManager.openCreate}
            disabled={closed}
          />
        }
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${movementListPadding.toolbar}`}
          >
            <MovementListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              productId={productId}
              onProductChange={setProductId}
              supplierId={supplierId}
              onSupplierChange={setSupplierId}
              customerId={customerId}
              onCustomerChange={setCustomerId}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <div className={movementListPadding.table}>
            <MovementTable
              movimientos={data?.data ?? []}
              isLoading={isLoading || isFetching}
              currentPage={currentPage}
              totalPages={data?.pagination.totalPages ?? 1}
              totalItems={data?.pagination.totalItems ?? 0}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>

      <MovementFormModal
        isOpen={movementManager.isOpen}
        onClose={movementManager.close}
        isMutating={movementManager.isMutating}
        form={movementManager.form}
        onSubmit={movementManager.onSubmit}
        isLoadingTiposMovimiento={movementManager.isLoadingTiposMovimiento}
        hasTiposMovimiento={movementManager.hasTiposMovimiento}
        tiposMovimiento={movementManager.tiposMovimiento}
      />
    </div>
  );
}
