"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BalanceInvoicesTable } from "./BalanceInvoicesTable";
import { BalanceInvoicesFilter } from "./BalanceInvoicesFilter";
import { BalanceInvoicesActions } from "./BalanceInvoicesActions";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useTabState } from "@/hooks/useTabState";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useBalanceInvoices } from "../hooks/useBalanceInvoices";
import { useBalanceInvoiceDelete } from "../hooks/useBalanceInvoiceDelete";
import { EstadoFactura } from "../schemas/BalanceInvoicesResponseSchema";

export function BalanceInvoicesContent() {
  // URL parameter management hooks
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { selectedTab, setTab } = useTabState({
    defaultValue: "active",
    resetPaginationOnChange: true,
  });

  const deleteModal = useBalanceInvoiceDelete();

  // Lazy loading: Only execute query for the active tab
  // When switching tabs, the new query runs and previous data stays in cache
  const isActiveTab = selectedTab === "active";
  const isPaidTab = selectedTab === "paid";
  const isOverdueTab = selectedTab === "overdue";

  const {
    data: unissuedData,
    error: unissuedError,
    isFetching: isFetchingUnissued,
  } = useBalanceInvoices({
    page: currentPage,
    // estado: EstadoFactura.ACTIVE,
    search: debouncedSearch || undefined,
    enabled: isActiveTab, // Only fetch when this tab is active
  });

  const {
    data: issuedData,
    error: issuedError,
    isFetching: isFetchingIssued,
  } = useBalanceInvoices({
    page: currentPage,
    estado: EstadoFactura.PAID,
    search: debouncedSearch || undefined,
    enabled: isPaidTab, // Only fetch when this tab is active
  });

  const {
    data: dispatchedData,
    error: dispatchedError,
    isFetching: isFetchingDispatched,
  } = useBalanceInvoices({
    page: currentPage,
    estado: EstadoFactura.OVERDUE,
    search: debouncedSearch || undefined,
    enabled: isOverdueTab, // Only fetch when this tab is active
  });

  // Select active tab data
  const activeData = isActiveTab
    ? unissuedData
    : isPaidTab
      ? issuedData
      : dispatchedData;
  const activeIsFetching = isActiveTab
    ? isFetchingUnissued
    : isPaidTab
      ? isFetchingIssued
      : isFetchingDispatched;
  const activeError = isActiveTab
    ? unissuedError
    : isPaidTab
      ? issuedError
      : dispatchedError;

  // Error handling
  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Balance Invoices" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Balance Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage balance invoices
          </p>
        </div>

        <BalanceInvoicesActions />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <BalanceInvoicesFilter
            searchTerm={searchTerm}
            onSearchChange={setSearch}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div className="border-b px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:shadow-none rounded-none"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="paid"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Paid
                </TabsTrigger>
                <TabsTrigger
                  value="overdue"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Overdue
                </TabsTrigger>
                <TabsTrigger
                  value="anulated"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Anulated
                </TabsTrigger>
              </TabsList>
            </div>

            {["active", "paid", "overdue", "anulated"].map((status) => (
              <TabsContent value={status} className="p-0" key={status}>
                <BalanceInvoicesTable
                  facturas={activeData?.data || []}
                  isLoading={activeIsFetching}
                  onDelete={({ sequence, number }) =>
                    deleteModal.openDeleteModal(sequence, number)
                  }
                  currentPage={currentPage}
                  totalPages={activeData?.pagination.totalPages || 1}
                  totalItems={activeData?.pagination.totalItems || 0}
                  onPageChange={setPage}
                />
              </TabsContent>
            ))}

            {/* <TabsContent value="issued" className="p-0">
              <DispatchOrdersTable
                dispatchOrders={activeData?.data || []}
                isLoading={activeIsFetching}
                onDispatch={() => {
                  // Refetch issued and dispatched tabs
                  window.location.reload();
                }}
                currentPage={currentPage}
                totalPages={activeData?.pagination.totalPages || 1}
                totalItems={activeData?.pagination.totalItems || 0}
                onPageChange={setPage}
              />
            </TabsContent>

            <TabsContent value="dispatched" className="p-0">
              <DispatchOrdersTable
                dispatchOrders={activeData?.data || []}
                isLoading={activeIsFetching}
                currentPage={currentPage}
                totalPages={activeData?.pagination.totalPages || 1}
                totalItems={activeData?.pagination.totalItems || 0}
                onPageChange={setPage}
              />
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <EntityDeleteModal
        isOpen={deleteModal.isDeleteModalOpen}
        onClose={deleteModal.closeDeleteModal}
        onConfirm={deleteModal.handleDeleteConfirm}
        entity="factura"
        entityName={`Factura #${deleteModal.facturaAEliminar?.number}`}
        isDeleting={deleteModal.isDeleting}
      />

      {/* Emit Confirmation Modal */}
      {/* <FacturasEmitModal
        isOpen={facturaModal.isEmitModalOpen}
        onClose={facturaModal.closeEmitModal}
        onConfirm={facturaModal.handleEmitWithConfirmation}
        dispatchOrder={facturaModal.dispatchOrderAEmitir}
        isEmitting={facturaModal.isEmitting}
      /> */}
    </div>
  );
}
