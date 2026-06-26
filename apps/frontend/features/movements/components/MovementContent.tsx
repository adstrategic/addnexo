"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovements } from "../hooks/useMovements";
import { MovementFormModal } from "../forms/MovementFormModal";
import { MovementTable } from "./MovementTable";
import { MovementActions } from "./MovementActions";
import { MovementFilters } from "./MovementFilters";
import { ErrorBoundary } from "@/components/error-boundary";
import { useMovementManager } from "../hooks/useMovementManager";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { usePeriod } from "@/lib/context/period-context";

export function MovementContent() {
  const { closed } = usePeriod();
  const [selectedTab, setSelectedTab] = useState("todos");
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  // Hook para acciones de movimientos
  const movementManager = useMovementManager();

  // Query para obtener movimientos
  const { data, isLoading, error, isFetching } = useMovements({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const filteredMovimientos = data?.data || [];

  // Manejo de errores
  if (error) {
    return <ErrorBoundary error={error} entityName="Movements" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kardex Movements</h1>
          <p className="text-sm text-muted-foreground">
            Inventory entry and exit management
          </p>
        </div>

        <MovementActions
          onOpenCreateModal={movementManager.openCreate}
          disabled={closed}
        />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <MovementFilters searchTerm={searchTerm} onSearchChange={setSearch} />
        </CardHeader>

        <CardContent className="p-0">
          <Tabs
            value={selectedTab}
            className="w-full"
            onValueChange={setSelectedTab}
          >
            <div className="border-b px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="todos"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  All Movements
                  {data?.pagination.totalItems && (
                    <span className="ml-2 bg-gray-200 px-2 py-1 rounded-full text-xs">
                      {data.pagination.totalItems}
                    </span>
                  )}
                </TabsTrigger>
                {/* Futuras pestañas para filtros por tipo */}
                {/* <TabsTrigger value="entradas">Entradas</TabsTrigger> */}
                {/* <TabsTrigger value="salidas">Salidas</TabsTrigger> */}
              </TabsList>
            </div>

            <TabsContent value="todos" className="p-0">
              <div className="p-4">
                <MovementTable
                  movimientos={filteredMovimientos}
                  isLoading={isLoading || isFetching}
                  currentPage={currentPage}
                  totalPages={data?.pagination.totalPages || 1}
                  totalItems={data?.pagination.totalItems || 0}
                  onPageChange={setPage}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Form Modal */}
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
