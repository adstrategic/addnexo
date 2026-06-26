"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useBalanceInvoices } from "../hooks/useBalanceInvoices";
import { useBalanceInvoiceDelete } from "../hooks/useBalanceInvoiceDelete";
import { useBalanceInvoiceListParams } from "../hooks/useBalanceInvoiceListParams";
import { BalanceInvoicesTable } from "./BalanceInvoicesTable";
import { BalanceInvoiceListToolbar } from "./BalanceInvoiceListToolbar";
import { BalanceInvoiceStatusTabs } from "./BalanceInvoiceStatusTabs";
import { BalanceInvoicesActions } from "./BalanceInvoicesActions";
import { BalanceInvoicePageHeader } from "./layout/BalanceInvoicePageHeader";
import { balanceInvoiceListPadding } from "./layout/balance-invoice-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { EstadoFactura } from "../schemas/BalanceInvoicesResponseSchema";

export function BalanceInvoicesContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    selectedTab,
    setTab,
    clearFilters,
    hasActiveFilters,
  } = useBalanceInvoiceListParams();

  const deleteModal = useBalanceInvoiceDelete();

  const isActiveTab = selectedTab === "active";
  const isPaidTab = selectedTab === "paid";
  const isOverdueTab = selectedTab === "overdue";
  const isAnulatedTab = selectedTab === "anulated";

  const listParams = {
    page: currentPage,
    search: debouncedSearch,
  };

  const {
    data: activeData,
    error: activeTabError,
    isLoading: isLoadingActive,
    isFetching: isFetchingActive,
  } = useBalanceInvoices({
    ...listParams,
    estado: EstadoFactura.ACTIVE,
    enabled: isActiveTab,
  });

  const {
    data: paidData,
    error: paidError,
    isLoading: isLoadingPaid,
    isFetching: isFetchingPaid,
  } = useBalanceInvoices({
    ...listParams,
    estado: EstadoFactura.PAID,
    enabled: isPaidTab,
  });

  const {
    data: overdueData,
    error: overdueError,
    isLoading: isLoadingOverdue,
    isFetching: isFetchingOverdue,
  } = useBalanceInvoices({
    ...listParams,
    estado: EstadoFactura.OVERDUE,
    enabled: isOverdueTab,
  });

  const {
    data: anulatedData,
    error: anulatedError,
    isLoading: isLoadingAnulated,
    isFetching: isFetchingAnulated,
  } = useBalanceInvoices({
    ...listParams,
    estado: EstadoFactura.ANULATED,
    enabled: isAnulatedTab,
  });

  const activeListData = isActiveTab
    ? activeData
    : isPaidTab
      ? paidData
      : isOverdueTab
        ? overdueData
        : anulatedData;

  const activeIsLoading = isActiveTab
    ? isLoadingActive
    : isPaidTab
      ? isLoadingPaid
      : isOverdueTab
        ? isLoadingOverdue
        : isLoadingAnulated;

  const activeIsFetching = isActiveTab
    ? isFetchingActive
    : isPaidTab
      ? isFetchingPaid
      : isOverdueTab
        ? isFetchingOverdue
        : isFetchingAnulated;

  const activeError = isActiveTab
    ? activeTabError
    : isPaidTab
      ? paidError
      : isOverdueTab
        ? overdueError
        : anulatedError;

  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Balance Invoices" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <BalanceInvoicePageHeader
        title="Balance Invoices"
        description="Manage outstanding balance billing for clients"
        actions={<BalanceInvoicesActions />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${balanceInvoiceListPadding.toolbar}`}
          >
            <BalanceInvoiceListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div
              className={`overflow-x-auto border-b border-border ${balanceInvoiceListPadding.toolbar}`}
            >
              <BalanceInvoiceStatusTabs />
            </div>

            <TabsContent value={selectedTab} className="mt-0 p-0">
              <BalanceInvoicesTable
                facturas={activeListData?.data ?? []}
                isLoading={activeIsLoading}
                isFetching={activeIsFetching && !activeIsLoading}
                onDelete={({ sequence, number }) =>
                  deleteModal.openDeleteModal(sequence, number)
                }
                currentPage={currentPage}
                totalPages={activeListData?.pagination.totalPages ?? 1}
                totalItems={activeListData?.pagination.totalItems ?? 0}
                onPageChange={setPage}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EntityDeleteModal
        isOpen={deleteModal.isDeleteModalOpen}
        onClose={deleteModal.closeDeleteModal}
        onConfirm={deleteModal.handleDeleteConfirm}
        entity="balance invoice"
        entityName={`Balance Invoice #${deleteModal.facturaAEliminar?.number ?? ""}`}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
}
